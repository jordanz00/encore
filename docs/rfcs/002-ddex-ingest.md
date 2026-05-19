# RFC 002 — DDEX ERN-4 Distributor Ingest

- **Status:** Draft
- **RFC Number:** 002
- **Authors:** Encore Architecture
- **Last Updated:** 2026-05-06
- **Related:** RFC 003 (Audio Quality), Role 07 (Ingest + Transcode), Role 08 (Database + Warehouse)

## Status
Draft — open for review. Targeted for v0.2.

## Context
Independent artists onboard via direct upload through `apps/api/src/routes/uploads.ts`, but the long tail of catalog (≈90% of any commercial streaming catalog) flows through DDEX-speaking distributors: DistroKid, CD Baby, AWAL, Symphonic, Believe, Merlin members, and aggregators of aggregators. None of them will integrate with a one-off REST API. The price of being a "real" streaming destination is speaking **DDEX ERN-4** for inbound metadata + audio and **DDEX DSR (Digital Sales Reporting)** for outbound usage reports.

ERN-4 is the current major: `NewReleaseMessage` for catalog deliveries, `MusicalWorkMetadataMessage` for composition / publishing rights (separate flow from sound recordings), and a small family of takedown / update messages. Audio is delivered alongside the XML, either as files referenced by relative path (SFTP drop) or as URLs in the message (signed-URL drop). Distributors expect idempotency keyed by **ICPN/UPC** at release level and **ISRC** at track level.

The schema already has hooks: `releases.upc`, `tracks.isrc`, `releases.sourceKind = 'ddex'`, `releases.sourceRef`, plus dedicated `ingest_sources` and `ingest_jobs` tables in `packages/db/src/schema.ts`. The placeholder route `apps/api/src/routes/ingest-ddex.ts` and worker job `apps/worker/src/jobs/ddex-delivery.ts` are wired but unimplemented; this RFC ratifies what they will do.

## Decision
We accept distributor deliveries via two transports, normalized to one internal pipeline.

### Delivery contract — two transports

1. **HMAC-signed POST.** Distributors POST a multipart envelope (XML + audio files + cover art) to `POST /ingest/ddex/:sourceId`. The HTTP signature is `Authorization: DDEX-HMAC-SHA256 keyId="kid",signature="..."`, computed over `(method, path, contentSha256, dateHeader)`. The shared secret is provisioned per `ingest_sources` row (`configJson.hmacSecret`), rotatable without code change.
2. **SFTP drop.** Distributors who can't (or won't) speak HTTP drop a tarball into a per-distributor SFTP home (`/ingest/{distributorRef}/inbox/`); a watcher worker normalizes them into the same internal job shape.

Either transport produces a row in `ingest_jobs` with `kind='ddex'` and `payloadRef='s3://...'` pointing at the raw envelope, persisted to the `encore-uploads` bucket (`infra/docker/docker-compose.yml`).

### ERN-4 message types

We support (v0.2):

- **`NewReleaseMessage`** — full and incremental release deliveries. Required fields: `MessageHeader.MessageId`, `ReleaseList.Release[].ReleaseId.ICPN` (or `ProprietaryId`), `ResourceList.SoundRecording[].ISRC`, `DealList.ReleaseDeal[]` (territory + DSP scope).
- **`PurgeReleaseMessage` / `TakedownMessage`** — sets `releases.status = 'takedown'` (`releaseStatus` enum exists in `packages/db/src/schema.ts`) and revokes signed CDN URLs.
- **`MusicalWorkMetadataMessage`** — composition + publisher metadata. Mapped to a new `musical_works` table (added in this RFC's migration) and joined to `tracks` by ISWC / ISRC pairing.

### DSR usage reports (outbound)

A monthly aggregator job reads the range-partitioned `plays` table (Role 08; `packages/db/src/schema.ts` ~lines 484–506), filters to verified plays (`isVerifiedPlay = true`, ≥ 30 s delivered — DSR-class definition), groups by ISRC × territory × subscription tier, and emits one DSR file per distributor to the same SFTP / signed URL each distributor configured.

### Internal pipeline

1. **Receive + persist.** Land the raw envelope to `encore-uploads`, insert `ingest_jobs` row, ack the distributor with a `MessageId` and a `DeliveryReceipt`.
2. **Validate + parse.** `apps/worker/src/jobs/ddex-delivery.ts` validates against the ERN-4 XSD (cached locally — no public-internet dependency for self-hosters), extracts `MessageHeader`, `ReleaseList`, `ResourceList`, `DealList`, plus optional `MusicalWorkMetadataMessage`.
3. **Idempotency by ICPN/UPC + ISRC.** Compute a delivery key from `(sourceId, ICPN, ISRCs[], MessageRevisionId)`. If we've seen the same ICPN with revision `≥ current`, no-op; if it's a higher revision, update; if it's a takedown, set `releases.status = 'takedown'`. All work runs in a single Drizzle transaction.
4. **Materialize.** Upsert `releases`, `release_artists`, `tracks`, `track_credits` per `packages/db/src/schema.ts`. Audio files queue into the standard transcode pipeline (Role 07) via `audioTranscode` — DDEX doesn't get its own audio path.
5. **Acknowledge.** Emit a `DeliveryAcknowledgement` back via the same transport (HTTP 200 with body, or `.ack.xml` in the SFTP outbox).

### Distributor onboarding

A new distributor flows through:

1. Editor creates an `ingest_sources` row (kind `'ddex'`, `distributorRef`, `configJson` containing transport + HMAC secret + SFTP user).
2. Distributor sends a test `NewReleaseMessage` to a sandbox endpoint (`/ingest/ddex/:sourceId/sandbox`) — same parser, write blocked.
3. We sign off on a "first live delivery" window; first three real deliveries are reviewed manually before auto-publish kicks in.

### Error handling

- ERN-4 parse error → `ingest_jobs.status = 'invalid'`, attach human-readable reason, return ack with `ResponseStatus = 'Rejected'`.
- Audio file missing → status `'missing_audio'`, request resend in the ack; retry after redelivery.
- Transient errors (S3 5xx, DB timeout) → exponential backoff up to 24 h, then dead-letter with paging.
- Conflict (two distributors deliver overlapping ISRCs) → quarantine in `'conflict'` status, route to editorial review.

## Alternatives
- **Custom JSON ingest.** Rejected: distributors won't build a custom integration for our long tail; DDEX is the lingua franca.
- **Third-party DDEX gateway (Revelator, FUGA, etc.).** Rejected for v1: locks the AGPL self-host story behind a paid SaaS dependency. Revisitable as a managed-tier feature.
- **ERN-3 only.** Rejected: ERN-3 is sunsetting; new distributors deliver ERN-4 by default.

## Consequences
- We own an XSD parser, per-distributor onboarding flow (HMAC key issuance, SFTP user provisioning, sandbox), and a DSR generator. Real engineering work, but well-scoped.
- `ingest_sources.distributorRef` becomes the integration key; we publish a public list of supported distributors and a "request integration" form.
- `musical_works` is a new table; migration must be additive and backwards-compatible per Role 10's two-version contract.
- DSR cadence drives ClickHouse query patterns; Role 08's monthly partitioning aligns naturally.

## Open Questions
- ERN-4.3 vs 4.2 minimum support — accept both forever or sunset 4.2 after 12 months?
- Sandbox endpoint discoverable to all (`/ingest/ddex/sandbox`) or per-source-only?
- DSR delivery cadence — strict monthly, or per-distributor configurable?
- `MusicalWorkMetadataMessage` storage — new `musical_works` table (proposed) or attach to existing `track_credits` (`packages/db/src/schema.ts`)?
- Conflict resolution when overlapping ISRCs arrive from two distributors — first-write-wins, last-write-wins, or always quarantine for editorial?
