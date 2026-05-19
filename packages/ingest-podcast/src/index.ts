/**
 * @encore/ingest-podcast — RSS + Podcasting 2.0 parser.
 *
 * Recognized namespaces:
 *   - itunes:  category, image, explicit, duration
 *   - podcast: guid, transcript, chapters, value, locked, person, location
 *   - atom:    self, link
 *
 * Returns a normalized `ParsedFeed` the worker upserts into the DB. Also
 * exports an OPML parser for "import all my subscriptions" UX.
 */
import { XMLParser } from "fast-xml-parser";

export interface ParsedEpisode {
  guid: string;
  title: string;
  description: string | null;
  enclosureUrl: string;
  enclosureType: string | null;
  enclosureLengthBytes: number | null;
  durationMs: number | null;
  publishedAt: string | null;
  chapters: { title: string; startSeconds: number }[];
  transcriptUrl: string | null;
  transcriptType: string | null;
  imageUrl: string | null;
  explicit: boolean;
}

export interface ParsedFeed {
  podcastGuid: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  language: string | null;
  categories: string[];
  explicit: boolean;
  websiteUrl: string | null;
  /** podcast:locked tag — `true` blocks unauthorized re-publishing. */
  locked: boolean;
  ownerEmail: string | null;
  /** podcast:value (V4V) — kept verbatim so we can render lightning splits. */
  value: PodcastValue | null;
  episodes: ParsedEpisode[];
}

export interface PodcastValue {
  type: string;
  method: string;
  suggested: string | null;
  recipients: { name: string; address: string; type: string; split: number }[];
}

export function parseRssFeed(xml: string): ParsedFeed {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: false,
    parseAttributeValue: false,
    parseTagValue: false,
    trimValues: true,
  });
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel ?? doc?.feed;
  if (!channel) throw new Error("podcast_invalid_root");

  const items = arr(channel.item ?? channel.entry);
  const podcastValue = parseValue(channel["podcast:value"]);
  const podcastGuid = strOf(channel["podcast:guid"]);
  const lockedTag = channel["podcast:locked"];
  const ownerEmail = strOf(channel["itunes:owner"]?.["itunes:email"]);

  const categories = collectCategories(channel);
  const websiteUrl = strOf(channel.link?.["@_href"] ?? channel.link);

  const episodes = items.map(parseEpisode).filter(
    (e): e is ParsedEpisode => e !== null,
  );

  return {
    podcastGuid: podcastGuid ?? null,
    title: strOf(channel.title) ?? "(untitled feed)",
    description:
      strOf(channel.description) ?? strOf(channel["itunes:summary"]) ?? null,
    imageUrl:
      strOf(channel.image?.url) ??
      strOf(channel["itunes:image"]?.["@_href"]) ??
      null,
    language: strOf(channel.language) ?? null,
    categories,
    explicit: parseExplicit(channel["itunes:explicit"]),
    websiteUrl: websiteUrl ?? null,
    locked: strOf(lockedTag) === "yes" || lockedTag?.["#text"] === "yes",
    ownerEmail: ownerEmail ?? null,
    value: podcastValue,
    episodes,
  };
}

function parseEpisode(item: any): ParsedEpisode | null {
  if (!item) return null;
  const enclosure = item.enclosure ?? item["media:content"];
  if (!enclosure) return null;
  const enclosureUrl = enclosure["@_url"] ?? enclosure.url;
  if (!enclosureUrl) return null;
  const guid =
    strOf(item.guid?.["#text"] ?? item.guid) ??
    strOf(item.id) ??
    enclosureUrl;
  const durationStr = strOf(item["itunes:duration"]);
  const transcript = item["podcast:transcript"];
  const chaptersTag = item["podcast:chapters"];
  const chapters = parseInlineChapters(chaptersTag);
  return {
    guid,
    title: strOf(item.title) ?? "(untitled episode)",
    description: strOf(item.description) ?? strOf(item["itunes:summary"]) ?? null,
    enclosureUrl,
    enclosureType: enclosure["@_type"] ?? null,
    enclosureLengthBytes: numOrNull(enclosure["@_length"]),
    durationMs: parseDurationToMs(durationStr),
    publishedAt: strOf(item.pubDate ?? item.published) ?? null,
    chapters,
    transcriptUrl: transcript?.["@_url"] ?? null,
    transcriptType: transcript?.["@_type"] ?? null,
    imageUrl: item["itunes:image"]?.["@_href"] ?? null,
    explicit: parseExplicit(item["itunes:explicit"]),
  };
}

function parseInlineChapters(node: any): ParsedEpisode["chapters"] {
  if (!node) return [];
  if (typeof node === "string") return [];
  const items = arr(node?.chapters?.chapter ?? node?.chapter);
  return items
    .map((c: any) => ({
      title: strOf(c.title) ?? "(chapter)",
      startSeconds: Number(c.startTime ?? c["@_startTime"] ?? 0),
    }))
    .filter((c) => Number.isFinite(c.startSeconds));
}

function parseValue(node: any): PodcastValue | null {
  if (!node) return null;
  const recipientNodes = arr(node["podcast:valueRecipient"]);
  return {
    type: strOf(node["@_type"]) ?? "lightning",
    method: strOf(node["@_method"]) ?? "keysend",
    suggested: strOf(node["@_suggested"]) ?? null,
    recipients: recipientNodes.map((r: any) => ({
      name: strOf(r["@_name"]) ?? "",
      address: strOf(r["@_address"]) ?? "",
      type: strOf(r["@_type"]) ?? "node",
      split: Number(r["@_split"] ?? 0),
    })),
  };
}

function collectCategories(channel: any): string[] {
  const out = new Set<string>();
  for (const c of arr(channel["itunes:category"])) {
    const text = strOf(c["@_text"]);
    if (text) out.add(text);
    for (const sub of arr(c["itunes:category"])) {
      const t = strOf(sub["@_text"]);
      if (t) out.add(t);
    }
  }
  for (const c of arr(channel.category)) {
    const t = strOf(c);
    if (t) out.add(t);
  }
  return Array.from(out);
}

function parseExplicit(v: unknown): boolean {
  if (!v) return false;
  const s = String(strOf(v)).toLowerCase();
  return s === "yes" || s === "true" || s === "explicit";
}

function parseDurationToMs(s: string | null): number | null {
  if (!s) return null;
  if (/^\d+$/.test(s)) return Number(s) * 1000;
  const parts = s.split(":").map(Number);
  if (parts.some((p) => !Number.isFinite(p))) return null;
  if (parts.length === 3) return (parts[0]! * 3600 + parts[1]! * 60 + parts[2]!) * 1000;
  if (parts.length === 2) return (parts[0]! * 60 + parts[1]!) * 1000;
  return Number(s) * 1000;
}

function arr<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function strOf(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && "#text" in v) return String((v as any)["#text"]).trim();
  return undefined;
}

function numOrNull(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ---------- OPML import ----------

export interface OpmlEntry {
  title: string;
  feedUrl: string;
  websiteUrl: string | null;
}

export function parseOpml(xml: string): OpmlEntry[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: false,
  });
  const doc = parser.parse(xml);
  const out: OpmlEntry[] = [];
  walkOutline(doc?.opml?.body?.outline, out);
  return out;
}

function walkOutline(node: any, out: OpmlEntry[]): void {
  if (!node) return;
  const items = Array.isArray(node) ? node : [node];
  for (const it of items) {
    const feedUrl = it["@_xmlUrl"];
    if (feedUrl) {
      out.push({
        title: it["@_title"] ?? it["@_text"] ?? "(untitled)",
        feedUrl,
        websiteUrl: it["@_htmlUrl"] ?? null,
      });
    }
    if (it.outline) walkOutline(it.outline, out);
  }
}
