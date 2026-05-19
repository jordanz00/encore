/**
 * @encore/ingest-ddex — DDEX ERN-4 ingest, HMAC delivery verification,
 * and DSR (Digital Sales Reporting) generation.
 *
 * WHO THIS IS FOR: backend engineers wiring distributor delivery + monthly
 *   royalty reporting. Distributors (DistroKid, CD Baby, TuneCore, Amuse,
 *   RouteNote, Believe, Stem) all use ERN-4. Same standard Spotify uses.
 *
 * WHAT IT DOES:
 *   1. `verifyDeliverySignature` — verifies HMAC-SHA256 signature on inbound
 *      delivery POSTs against per-distributor shared secret.
 *   2. `parseErn4Manifest` — parses an ERN-4 NewReleaseMessage XML into a
 *      strongly-typed object the worker can persist as Releases + Tracks.
 *   3. `buildDsrUsageReport` — emits a flat-file DSR Sales/Usage report per
 *      DDEX DSR-F standard for a given distributor + period.
 *
 * HOW IT CONNECTS:
 *   - `apps/api/src/routes/ingest-ddex.ts` calls `verifyDeliverySignature`.
 *   - `apps/worker/src/jobs/ddex-delivery.ts` calls `parseErn4Manifest`.
 *   - `apps/admin` schedules monthly `buildDsrUsageReport` runs.
 *
 * SPEC REFERENCE: DDEX ERN 4.3, DSR-F 4.0 (https://kb.ddex.net/).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { XMLParser } from "fast-xml-parser";

// ---------- HMAC delivery signature ----------

export interface VerifySignatureInput {
  /** Raw request body bytes. */
  body: Buffer | string;
  /** Value of the `X-Encore-Signature` header (hex). */
  signatureHex: string;
  /** Distributor's shared secret (32+ bytes, base64 or raw). */
  sharedSecret: string;
  /** Optional timestamp header to enforce a freshness window (seconds). */
  timestampHeader?: string;
  freshnessSeconds?: number;
}

export interface VerifySignatureResult {
  ok: boolean;
  reason?:
    | "missing_signature"
    | "missing_timestamp"
    | "timestamp_skew_too_large"
    | "signature_mismatch";
}

/**
 * Verify a distributor's delivery signature.
 *
 * The signed payload is `${timestamp}.${body}` — this prevents replay attacks.
 * Distributors compute HMAC-SHA256 with their shared secret, hex-encode it,
 * and send it in the `X-Encore-Signature` header alongside
 * `X-Encore-Timestamp` (Unix seconds).
 */
export function verifyDeliverySignature(input: VerifySignatureInput): VerifySignatureResult {
  if (!input.signatureHex) return { ok: false, reason: "missing_signature" };

  const freshnessSeconds = input.freshnessSeconds ?? 300;
  if (input.timestampHeader) {
    const ts = Number(input.timestampHeader);
    if (!Number.isFinite(ts)) return { ok: false, reason: "missing_timestamp" };
    const skew = Math.abs(Math.floor(Date.now() / 1000) - ts);
    if (skew > freshnessSeconds) return { ok: false, reason: "timestamp_skew_too_large" };
  } else if (freshnessSeconds > 0) {
    return { ok: false, reason: "missing_timestamp" };
  }

  const bodyStr = typeof input.body === "string" ? input.body : input.body.toString("utf8");
  const signedPayload = `${input.timestampHeader ?? ""}.${bodyStr}`;
  const expected = createHmac("sha256", input.sharedSecret)
    .update(signedPayload, "utf8")
    .digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(input.signatureHex, "hex");
  } catch {
    return { ok: false, reason: "signature_mismatch" };
  }
  if (provided.length !== expected.length) return { ok: false, reason: "signature_mismatch" };
  return timingSafeEqual(provided, expected)
    ? { ok: true }
    : { ok: false, reason: "signature_mismatch" };
}

// ---------- ERN-4 NewReleaseMessage parser ----------

export interface ParsedSoundRecording {
  resourceReference: string;
  isrc: string | null;
  title: string;
  durationIso8601: string | null;
  durationMs: number | null;
  displayArtist: string | null;
  contributors: { role: string; name: string }[];
  /** Source URL or relative path inside the delivery package. */
  audioFileUri: string | null;
  audioMd5: string | null;
}

export interface ParsedRelease {
  releaseReference: string;
  upc: string | null;
  title: string;
  releaseType: string;
  displayArtist: string | null;
  labelName: string | null;
  /** ISO 8601 release date. */
  releaseDate: string | null;
  pLine: string | null;
  cLine: string | null;
  genres: string[];
  /** Resource references in track order. */
  trackResourceRefs: string[];
  coverArtUri: string | null;
}

export interface ParsedErn4 {
  messageId: string;
  messageSenderName: string | null;
  messageRecipientName: string | null;
  messageCreatedDateTime: string | null;
  releases: ParsedRelease[];
  soundRecordings: Map<string, ParsedSoundRecording>;
}

/**
 * Parse a NewReleaseMessage (ERN-4) XML document.
 *
 * Tolerant of namespace prefixes and minor variations between distributor
 * implementations. Throws on malformed XML or missing required fields.
 */
export function parseErn4Manifest(xml: string): ParsedErn4 {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    parseAttributeValue: false,
    parseTagValue: false,
    trimValues: true,
  });
  const doc = parser.parse(xml);
  const root = doc.NewReleaseMessage ?? doc["ern:NewReleaseMessage"];
  if (!root) {
    throw new Error("ddex_invalid_root: expected NewReleaseMessage");
  }

  const header = root.MessageHeader ?? {};
  const messageId = String(header.MessageId ?? "").trim();
  if (!messageId) throw new Error("ddex_missing_message_id");

  const messageSenderName =
    header.MessageSender?.PartyName?.FullName?.toString?.() ?? null;
  const messageRecipientName =
    header.MessageRecipient?.PartyName?.FullName?.toString?.() ?? null;
  const messageCreatedDateTime = header.MessageCreatedDateTime?.toString?.() ?? null;

  // Resources (sound recordings)
  const recordingsRaw = arr(root.ResourceList?.SoundRecording);
  const soundRecordings = new Map<string, ParsedSoundRecording>();
  for (const sr of recordingsRaw) {
    const ref = String(sr.ResourceReference ?? "").trim();
    if (!ref) continue;
    const technical = arr(sr.TechnicalDetails)[0] ?? {};
    const file = technical.DeliveryFile ?? technical.File ?? {};
    const detailsByTerritory = arr(sr.SoundRecordingDetailsByTerritory)[0] ?? {};
    const details = sr.SoundRecordingDetailsByTerritory ? detailsByTerritory : sr;
    const titleNode = arr(details.Title ?? sr.Title)[0] ?? {};
    const title =
      titleNode.TitleText?.toString?.() ??
      titleNode.toString?.() ??
      sr.ReferenceTitle?.TitleText?.toString?.() ??
      "(untitled)";

    const isrc = sr.SoundRecordingId?.ISRC?.toString?.() ?? null;
    const durationIso = sr.Duration?.toString?.() ?? null;

    const contributorsRaw = arr(details.Contributor ?? sr.Contributor);
    const contributors = contributorsRaw.map((c: any) => ({
      role: String(c.Role ?? c.ContributorRole ?? "performer"),
      name: String(c.PartyName?.FullName ?? c.Name ?? ""),
    }));
    const displayArtist =
      arr(details.DisplayArtist ?? sr.DisplayArtist)[0]?.PartyName?.FullName?.toString?.() ??
      contributors.find((c: any) => c.role.toLowerCase().includes("main"))?.name ??
      null;

    soundRecordings.set(ref, {
      resourceReference: ref,
      isrc,
      title: String(title),
      durationIso8601: durationIso,
      durationMs: parseIso8601DurationToMs(durationIso),
      displayArtist,
      contributors,
      audioFileUri:
        file.URI?.toString?.() ??
        file.URL?.toString?.() ??
        file.FileName?.toString?.() ??
        null,
      audioMd5: file.HashSum?.HashSum?.toString?.() ?? file.HashSum?.toString?.() ?? null,
    });
  }

  // Releases
  const releasesRaw = arr(root.ReleaseList?.Release);
  const releases: ParsedRelease[] = releasesRaw.map((r: any) => {
    const ref = String(r.ReleaseReference ?? r.ReleaseId?.ICPN ?? "").trim();
    const upc = r.ReleaseId?.ICPN?.toString?.() ?? null;
    const detailsByTerritory = arr(r.ReleaseDetailsByTerritory)[0] ?? {};
    const details = r.ReleaseDetailsByTerritory ? detailsByTerritory : r;
    const title =
      arr(details.Title ?? r.Title)[0]?.TitleText?.toString?.() ??
      r.ReferenceTitle?.TitleText?.toString?.() ??
      "(untitled)";

    const releaseType =
      details.ReleaseType?.toString?.() ?? r.ReleaseType?.toString?.() ?? "Album";
    const displayArtist =
      arr(details.DisplayArtist ?? r.DisplayArtist)[0]?.PartyName?.FullName?.toString?.() ??
      null;
    const labelName =
      arr(details.LabelName ?? r.LabelName)[0]?.toString?.() ??
      details.LabelName?.toString?.() ??
      null;
    const releaseDate =
      details.ReleaseDate?.toString?.() ?? r.ReleaseDate?.toString?.() ?? null;
    const pLine = arr(details.PLine ?? r.PLine)[0]?.PLineText?.toString?.() ?? null;
    const cLine = arr(details.CLine ?? r.CLine)[0]?.CLineText?.toString?.() ?? null;
    const genres = arr(details.Genre ?? r.Genre).map((g: any) =>
      String(g.GenreText ?? g).trim(),
    );
    const trackRefs = arr(r.ReleaseResourceReferenceList?.ReleaseResourceReference)
      .map((x: any) => String(x.toString?.() ?? x).trim())
      .filter(Boolean);

    const coverArtUri =
      arr(root.ResourceList?.Image)
        .find((img: any) => img.ImageType?.toString?.() === "FrontCoverImage")
        ?.TechnicalDetails?.DeliveryFile?.URI?.toString?.() ?? null;

    return {
      releaseReference: ref,
      upc,
      title: String(title),
      releaseType: String(releaseType),
      displayArtist,
      labelName,
      releaseDate,
      pLine,
      cLine,
      genres,
      trackResourceRefs: trackRefs,
      coverArtUri,
    };
  });

  return {
    messageId,
    messageSenderName,
    messageRecipientName,
    messageCreatedDateTime,
    releases,
    soundRecordings,
  };
}

function arr<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/** Parse ISO 8601 duration like `PT3M27S` to milliseconds. */
export function parseIso8601DurationToMs(iso: string | null): number | null {
  if (!iso) return null;
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(iso);
  if (!m) return null;
  const hours = Number(m[1] ?? 0);
  const minutes = Number(m[2] ?? 0);
  const seconds = Number(m[3] ?? 0);
  return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
}

// ---------- DSR usage report generator ----------

export interface DsrUsageRow {
  isrc: string;
  /** ISO 4217 currency. */
  currency: string;
  /** YYYY-MM (period of usage). */
  period: string;
  totalPlays: number;
  totalListeners: number;
  /** Net royalty payable for this row in minor units (cents). */
  payableNetCents: number;
  /** Country of usage in ISO 3166 alpha-2; "WW" for worldwide aggregate. */
  countryCode: string;
}

export interface DsrUsageReportInput {
  distributorRef: string;
  periodMonth: string;
  rows: DsrUsageRow[];
}

/**
 * Build a DDEX DSR-F flat-file usage report.
 *
 * Format: pipe-delimited, one header row, one data row per ISRC × country.
 * Distributor systems (and Merlin) ingest this as the canonical royalty
 * accounting feed. Real DSR-F is XML-flavored too — we emit the flat-file
 * variant first because it round-trips through every distributor's tooling.
 *
 * @returns plain-text DSR document
 */
export function buildDsrUsageReport(input: DsrUsageReportInput): string {
  const headers = [
    "BlockType",
    "DSP_ID",
    "ISRC",
    "PeriodStart",
    "PeriodEnd",
    "Country",
    "Currency",
    "Plays",
    "UniqueListeners",
    "NetPayableMinorUnits",
  ];
  const lines: string[] = [];
  lines.push(`HD|Encore|${input.distributorRef}|${input.periodMonth}|DSR-F-1.0`);
  lines.push(headers.join("|"));
  const [year, month] = input.periodMonth.split("-").map(Number);
  const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year!, month!, 0)).getUTCDate();
  const periodEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  for (const row of input.rows) {
    lines.push(
      [
        "DT",
        "Encore",
        row.isrc,
        periodStart,
        periodEnd,
        row.countryCode,
        row.currency,
        String(row.totalPlays),
        String(row.totalListeners),
        String(row.payableNetCents),
      ].join("|"),
    );
  }
  lines.push(`FT|${input.rows.length}`);
  return lines.join("\n") + "\n";
}
