# Role 11 — DDEX ERN-4 Distributor Ingest Owner

## Mission
Onboard the major indie distributors — DistroKid, CD Baby, TuneCore, Amuse, RouteNote — onto Encore using the same DDEX ERN-4 (Electronic Release Notification, version 4) delivery contract Spotify and Apple Music consume. Every signed delivery becomes a `releases` + `tracks` row pair, every audit-able usage report goes back to the distributor as a DDEX DSR-class file. The role owns the lifecycle: onboarding paperwork, delivery endpoint, signature verification, asset pull, transcoding handoff, scheduled publication, takedown processing, and monthly DSR usage reporting.

## Today
The HTTP entry point is a stub at `apps/api/src/routes/ingest-ddex.ts` — it gates on `ENABLE_DDEX_INGEST=true`, looks up an `ingest_sources` row by `distributorRef`, inserts an `ingest_jobs` row, and enqueues `queues.ddexDelivery`. There is no signature verification, no XML parser, no DSR generator, and no distributor onboarded. The downstream worker `apps/worker/src/jobs/ddex-delivery.ts` is also a stub. We have the schema shape (`ingestSources`, `ingestJobs`, `releases.sourceKind = "ddex"`, `releases.sourceRef`) but no live deliveries yet.

## Spec
1. **Onboarding kit** per distributor: signed delivery agreement, party identifiers (DPID), shared HMAC secret, allowlisted source IPs, SFTP/S3 pull credentials, contact tree for takedowns, and a sandbox endpoint they can hit before production.
2. **Delivery endpoint** accepts an ERN-4 manifest URL + DPID + delivery id. Reject if HMAC header does not match the per-distributor secret stored in `ingest_sources.configJson`. Reject if `distributorRef` is unknown or `enabled = false`.
3. **Manifest parser** for ERN-4 (`NewReleaseMessage`) and ERN-4 takedown (`PurgeReleaseMessage`). Map `ReleaseList/Release` → `releases`, `ResourceList/SoundRecording` → `tracks`, `ResourceList/Image` → cover art, `DealList/ReleaseDeal` → `priceFloorCents` + territory windowing. Persist UPC/EAN, ISRC, ISWC, P-line, C-line, parental advisory, and grid identifier.
4. **Asset pull** from the distributor's SFTP/S3 location into our object store (`masterKey` for original FLAC/WAV; cover art into `coverArtKey`). Hash-verify against the manifest's MD5/SHA-256 before accepting.
5. **Scheduling**: a release with future `releaseDate` lands as `releases.status = "scheduled"`; a cron flips it to `published` at the wall-clock release moment (territory-aware in v2).
6. **Takedowns**: a `PurgeReleaseMessage` flips `releases.status = "takedown"` and fires the takedown event into the federation outbox so fediverse subscribers retract.
7. **DSR reporting**: monthly DSR-class XML per distributor, per territory, summarising verified plays (`plays.isVerifiedPlay = true`) and net sales — delivered via SFTP back to the distributor.

## Implementation Notes
- `apps/api/src/routes/ingest-ddex.ts` — replace the stub `body` schema with real ERN-4 envelope validation, add HMAC verification middleware, and short-circuit on unknown DPID. Keep the 202 + jobId pattern; distributors expect a fast ack.
- `packages/db/src/schema.ts` — `ingestSources.kind = "ddex"` rows are the per-distributor contract; `ingestJobs.kind = "ddex"` tracks the delivery. `releases.sourceKind = "ddex"` + `releases.sourceRef = "{distributorRef}:{deliveryId}"` makes the lineage queryable.
- `apps/worker/src/jobs/ddex-delivery.ts` (sibling to `podcast-poll.ts`) does the heavy lifting: fetch manifest, parse XML (`fast-xml-parser` or `sax`), pull assets, hash-verify, upsert rows, enqueue the transcode job, then mark the `ingest_jobs` row complete.
- DSR reports are a separate cron job emitting files to a per-distributor S3 prefix.

## Open Questions
- ERN-4 only, or do we accept legacy ERN-3.8.x for distributors that haven't migrated?
- Sandbox vs production endpoint — same path with a header flag, or separate hostnames?
- Do we honor distributor-supplied territory windowing on day one, or treat all releases as worldwide until v2?
- DSR cadence — monthly is the norm, but a few distributors want daily files; do we offer it as an opt-in?
