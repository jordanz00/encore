/**
 * @encore/activitypub — Real ActivityPub federation primitives.
 *
 * Surfaces:
 *   - generateActorKeyPair: creates RSA-2048 keypair for HTTP Signatures.
 *   - buildPersonActor: returns a JSON-LD Person actor for an artist.
 *   - buildWebfingerResponse: serves the .well-known/webfinger response.
 *   - buildAnnounceCreateNote: wraps a release publish into a Create(Note) activity.
 *   - signRequest: signs an outbound POST per draft-cavage HTTP Signatures.
 *   - verifyRequest: verifies an inbound signed request.
 *
 * Spec refs: ActivityPub (W3C 2018-01-23), HTTP Signatures (cavage-12).
 */
import {
  createSign,
  createVerify,
  generateKeyPairSync,
  createHash,
} from "node:crypto";

export interface ActorKeyPair {
  publicKeyPem: string;
  privateKeyPem: string;
}

export function generateActorKeyPair(): ActorKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKeyPem: publicKey, privateKeyPem: privateKey };
}

export interface PersonActorInput {
  baseUrl: string;
  artistSlug: string;
  preferredUsername: string;
  displayName: string;
  summary: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  publicKeyPem: string;
}

export function buildPersonActor(input: PersonActorInput): Record<string, unknown> {
  const id = `${input.baseUrl}/users/${input.artistSlug}`;
  return {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1",
    ],
    id,
    type: "Person",
    preferredUsername: input.preferredUsername,
    name: input.displayName,
    summary: input.summary ?? "",
    inbox: `${id}/inbox`,
    outbox: `${id}/outbox`,
    followers: `${id}/followers`,
    following: `${id}/following`,
    icon: input.iconUrl ? { type: "Image", url: input.iconUrl } : undefined,
    image: input.bannerUrl ? { type: "Image", url: input.bannerUrl } : undefined,
    publicKey: {
      id: `${id}#main-key`,
      owner: id,
      publicKeyPem: input.publicKeyPem,
    },
  };
}

export function buildWebfingerResponse(opts: {
  baseUrl: string;
  acct: string;
  artistSlug: string;
}): Record<string, unknown> {
  const actorIri = `${opts.baseUrl}/users/${opts.artistSlug}`;
  return {
    subject: `acct:${opts.acct}`,
    aliases: [actorIri],
    links: [
      {
        rel: "self",
        type: "application/activity+json",
        href: actorIri,
      },
      {
        rel: "http://webfinger.net/rel/profile-page",
        type: "text/html",
        href: `${opts.baseUrl}/artist/${opts.artistSlug}`,
      },
    ],
  };
}

export interface ReleaseNoteInput {
  baseUrl: string;
  artistSlug: string;
  releaseId: string;
  releaseTitle: string;
  releaseUrl: string;
  coverArtUrl: string | null;
  publishedAt: Date;
}

export function buildAnnounceCreateNote(input: ReleaseNoteInput): Record<string, unknown> {
  const actor = `${input.baseUrl}/users/${input.artistSlug}`;
  const noteId = `${input.baseUrl}/releases/${input.releaseId}/note`;
  const note: Record<string, unknown> = {
    id: noteId,
    type: "Note",
    attributedTo: actor,
    content: `New release: <a href="${input.releaseUrl}">${escapeHtml(
      input.releaseTitle,
    )}</a>`,
    url: input.releaseUrl,
    published: input.publishedAt.toISOString(),
    to: ["https://www.w3.org/ns/activitystreams#Public"],
    cc: [`${actor}/followers`],
  };
  if (input.coverArtUrl) {
    note.attachment = [
      { type: "Image", mediaType: "image/jpeg", url: input.coverArtUrl },
    ];
  }
  return {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${noteId}/activity`,
    type: "Create",
    actor,
    published: input.publishedAt.toISOString(),
    to: note.to,
    cc: note.cc,
    object: note,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------- HTTP Signatures (cavage-12) ----------

export interface SignRequestInput {
  method: string;
  url: string;
  body: string | Buffer;
  privateKeyPem: string;
  keyId: string;
  /** Header names to sign — defaults to "(request-target) host date digest". */
  headersToSign?: string[];
  /** Host header value (defaults to URL host). */
  host?: string;
  /** Date header value (defaults to current Date in HTTP format). */
  date?: string;
}

export interface SignedHeaders {
  Date: string;
  Host: string;
  Digest: string;
  Signature: string;
  "Content-Type": string;
}

export function signRequest(input: SignRequestInput): SignedHeaders {
  const u = new URL(input.url);
  const date = input.date ?? new Date().toUTCString();
  const host = input.host ?? u.host;
  const bodyBuf = typeof input.body === "string" ? Buffer.from(input.body, "utf8") : input.body;
  const digest = `SHA-256=${createHash("sha256").update(bodyBuf).digest("base64")}`;
  const requestTarget = `${input.method.toLowerCase()} ${u.pathname}${u.search}`;
  const headersToSign = input.headersToSign ?? [
    "(request-target)",
    "host",
    "date",
    "digest",
  ];
  const signingString = headersToSign
    .map((h) => {
      if (h === "(request-target)") return `(request-target): ${requestTarget}`;
      if (h === "host") return `host: ${host}`;
      if (h === "date") return `date: ${date}`;
      if (h === "digest") return `digest: ${digest}`;
      throw new Error(`unsupported_signature_header: ${h}`);
    })
    .join("\n");
  const signer = createSign("RSA-SHA256");
  signer.update(signingString);
  signer.end();
  const signature = signer.sign(input.privateKeyPem, "base64");
  const sigHeader = `keyId="${input.keyId}",algorithm="rsa-sha256",headers="${headersToSign.join(" ")}",signature="${signature}"`;
  return {
    Date: date,
    Host: host,
    Digest: digest,
    Signature: sigHeader,
    "Content-Type": "application/activity+json",
  };
}

export interface VerifyRequestInput {
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
  body: string | Buffer;
  /** Resolves a keyId IRI to its public key PEM. */
  resolvePublicKey: (keyId: string) => Promise<string | null>;
  /** Maximum allowed clock skew in seconds (default 300). */
  maxSkewSeconds?: number;
}

export interface VerifyResult {
  ok: boolean;
  reason?:
    | "missing_signature"
    | "missing_digest"
    | "digest_mismatch"
    | "stale_date"
    | "unknown_key"
    | "bad_signature";
  keyId?: string;
}

export async function verifyRequest(input: VerifyRequestInput): Promise<VerifyResult> {
  const sig = input.headers["signature"] ?? input.headers["Signature"];
  if (!sig) return { ok: false, reason: "missing_signature" };
  const parts = parseSignatureHeader(sig);
  const keyId = parts.keyId;
  if (!keyId) return { ok: false, reason: "missing_signature" };

  const dateHeader = input.headers["date"] ?? input.headers["Date"];
  if (dateHeader) {
    const ts = Date.parse(dateHeader);
    const skew = Math.abs(Date.now() - ts) / 1000;
    if (skew > (input.maxSkewSeconds ?? 300)) return { ok: false, reason: "stale_date" };
  }

  const digestHeader = input.headers["digest"] ?? input.headers["Digest"];
  if (!digestHeader) return { ok: false, reason: "missing_digest" };
  const bodyBuf = typeof input.body === "string" ? Buffer.from(input.body, "utf8") : input.body;
  const expectedDigest = `SHA-256=${createHash("sha256").update(bodyBuf).digest("base64")}`;
  if (digestHeader !== expectedDigest) return { ok: false, reason: "digest_mismatch" };

  const pub = await input.resolvePublicKey(keyId);
  if (!pub) return { ok: false, reason: "unknown_key", keyId };

  const headers = parts.headers.split(" ");
  const signingString = headers
    .map((h) => {
      if (h === "(request-target)")
        return `(request-target): ${input.method.toLowerCase()} ${input.path}`;
      const v = input.headers[h] ?? input.headers[capitalize(h)];
      return `${h}: ${v ?? ""}`;
    })
    .join("\n");
  const verifier = createVerify("RSA-SHA256");
  verifier.update(signingString);
  verifier.end();
  const ok = verifier.verify(pub, parts.signature, "base64");
  return ok ? { ok: true, keyId } : { ok: false, reason: "bad_signature", keyId };
}

function parseSignatureHeader(sig: string): {
  keyId: string;
  algorithm: string;
  headers: string;
  signature: string;
} {
  const out: Record<string, string> = {};
  for (const part of sig.split(",")) {
    const m = /^\s*(\w+)\s*=\s*"([^"]*)"\s*$/.exec(part);
    if (m) out[m[1]!] = m[2]!;
  }
  return {
    keyId: out.keyId ?? "",
    algorithm: out.algorithm ?? "rsa-sha256",
    headers: out.headers ?? "(request-target) host date digest",
    signature: out.signature ?? "",
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
