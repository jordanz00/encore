# Role 14 — Creative Commons + Public Domain Seed Catalog

## Mission
Seed Encore with a substantial, legally redistributable catalog from day one by ingesting Creative Commons and Public Domain music sources — Free Music Archive, ccMixter, Internet Archive's Live Music Archive, and the CC-licensed slice of Jamendo. The goal is twofold: give listeners something to discover before commercial catalog onboards, and give the platform a permanent, open foundation that can never be pulled by a rights-holder dispute. The role owns license preservation, attribution rendering, redistribution-rights tracking, and the per-source ingest crawler.

## Today
The schema enum `ingestSourceKind` already lists `"cc_seed"`, and `releases.sourceKind` can carry that value, but no seed has been ingested. There is no per-source crawler, no license-preservation column on releases or tracks, and no attribution renderer in the player. The closest pattern in the codebase is the DDEX path in `apps/api/src/routes/ingest-ddex.ts` and the worker stub in `apps/worker/src/jobs/podcast-poll.ts`; this role mirrors those patterns for a different upstream.

## Spec
1. **Sources, in priority order:**
   - **Free Music Archive (FMA)** — large catalog of CC-licensed and PD tracks across genres. Prefer the public dataset / API exports; respect each track's specific CC variant.
   - **ccMixter** — heavily remix-friendly catalog; strong CC-BY and CC-BY-SA representation.
   - **Internet Archive — Live Music Archive** — primarily taper-recorded live shows with explicit artist permission (Grateful Dead etc.); each item carries its own redistribution policy.
   - **Jamendo (CC tracks only)** — Jamendo also licenses commercial Pro tracks; we ingest **only** the CC-licensed portion and respect each track's `cc:license` field.
2. **License preservation.** Every imported track must carry, at minimum: the SPDX-style license id (e.g. `CC-BY-4.0`, `CC-BY-SA-4.0`, `CC-BY-NC-4.0`, `CC0-1.0`, `Public-Domain`), a license URL, the original source URL, the original author display name, and any non-default attribution string the source supplies.
3. **Redistribution rights.** Reject up front any track whose license forbids redistribution on a streaming platform; treat NC (`NonCommercial`) tracks as ad-free-only (no monetised play surface) until a per-license policy is decided. ND (`NoDerivatives`) tracks may stream but cannot appear in user remixes or derivative compilations.
4. **Attribution rendering.** Player UI must display the license badge, attribution line, and link-back to source on every CC track. The attribution must survive playlist embedding, sharing, and export (printable PDF if Role 19 ships one). Removing or hiding attribution silently is a release blocker.
5. **Crawler discipline.** Per-source rate limit, durable resume token, idempotent upsert keyed on the source's stable identifier (FMA track id, ccMixter upload id, IA item id, Jamendo track id), and robots.txt honoured.

## Implementation Notes
- `packages/db/src/schema.ts` — `releases.sourceKind = "cc_seed"` and `releases.sourceRef` already exist. Add a `trackLicenses` table (or a `licensesJson` column on `tracks`) for `licenseSpdx`, `licenseUrl`, `attributionName`, `attributionUrl`, `commercialUseAllowed`, `derivativesAllowed`, `shareAlikeRequired`. Backfill must be idempotent — every ingest run should converge on the same row, not duplicate.
- `apps/api/src/routes/ingest-ddex.ts` is the structural sibling: validate inbound, write an `ingest_jobs` row with `kind = "cc_seed"`, enqueue the per-source worker. Add a separate `apps/api/src/routes/ingest-cc.ts` so the surfaces stay decoupled.
- `apps/worker/src/jobs/podcast-poll.ts` is the closest existing crawler-shaped worker: same queue + concurrency pattern, same conditional-GET discipline. The CC seed worker will be its sibling at `apps/worker/src/jobs/cc-seed.ts`, one Worker instance per source, each with its own queue name.
- The audio asset pull, hash, and transcode pipeline is shared with DDEX — the asset is just stored against `tracks.masterKey` regardless of source.

## Open Questions
- Do we exclude `NC` tracks entirely, or expose them in a non-monetised tier?
- Live Music Archive shows are large, multi-track, and metadata-thin — do we ingest as multi-track releases or as single long-form items?
- Attribution strings often include URLs that can rot — do we snapshot the source page, or just link?
- License laundering risk on Jamendo (re-uploads of un-licensed material) — do we run a content-fingerprint cross-check before publishing?
