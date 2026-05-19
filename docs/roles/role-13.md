# Role 13 — Podcast RSS Ingest

## Mission
Ship podcast support that respects the open RSS standard and the Podcasting 2.0 namespace from day one. Encore does not own podcasts the way Spotify tries to own them with platform-exclusive deals — it indexes the open web, surfaces Podcasting 2.0 features (transcripts, chapters, Value-for-Value, locked feeds, durable GUIDs), and lets listeners bring their own subscriptions in via OPML. The role owns the entire podcast ingest path: feed discovery, polling, parsing, episode upsert, transcript and chapter handling, lock-flag honoring, and Value-for-Value plumbing.

## Today
The RSS poller exists in `apps/worker/src/jobs/podcast-poll.ts` as a deliberate stub: it fetches the URL, regex-extracts the channel `<title>`, and stamps `lastFetchedAt` + `nextFetchAt` (1 hour). It does not parse items, episodes, GUIDs, or any Podcasting 2.0 element. The HTTP side at `apps/api/src/routes/ingest-podcasts.ts` is also stub-grade. The schema has the right shape: `podcastFeeds` (with `podcastGuid`, `language`, `categories`, `explicit`) and `podcastEpisodes` (with `guid`, `enclosureUrl`, `chaptersJson`, `transcriptKey`).

## Spec
1. **Feed discovery.** Two paths: user-submitted feed URL (validate scheme = https, fetch, sniff MIME, sniff `<rss>` / `<feed>`); and Podcasting 2.0 Index sync (`https://api.podcastindex.org`) for catalog seeding and trending feeds. Deduplicate by `podcast:guid` first, then by canonicalised feed URL.
2. **Polling cadence.** Adaptive: hourly for feeds that publish weekly or more often, daily for slower feeds, on-demand if a `WebSub` (`rel="hub"`) hub is declared. Honour `Cache-Control` and conditional GET (`If-None-Match`, `If-Modified-Since`).
3. **Podcasting 2.0 elements (mandatory):**
   - `<podcast:guid>` — the durable feed identifier; survives URL changes. Stored on `podcastFeeds.podcastGuid`.
   - `<podcast:transcript>` — pull SRT/VTT/HTML/JSON; store under `podcastEpisodes.transcriptKey`. Prefer SRT or VTT.
   - `<podcast:chapters>` — fetch JSON chapters URL, validate against the Podcasting 2.0 chapters schema, persist into `podcastEpisodes.chaptersJson`.
   - `<podcast:value>` — capture Value-for-Value blocks (Lightning splits, custom keys) for podcasts that opt into V4V tipping.
   - `<podcast:locked>` — when `yes` with an `owner` email, do not allow Encore to "import" the show into another platform's directory; we still play the open feed, we just respect the lock flag in our own UI.
4. **OPML import.** Users upload an OPML file; we parse `<outline xmlUrl="…">` entries, queue feed-add jobs per outline, and report per-feed success/failure inline.
5. **Sanitisation.** Strip `<script>`, normalise show notes HTML, validate enclosure URLs against an allowlist of audio MIME types, and clamp episode title / description lengths to schema limits.

## Implementation Notes
- `apps/worker/src/jobs/podcast-poll.ts` — replace the regex with a real parser. Recommend `fast-xml-parser` configured with namespace awareness for the `podcast:` prefix; alternative is a streaming SAX parser for very large feeds. Persist episodes via `db.insert(schema.podcastEpisodes)` with `onConflictDoUpdate` keyed on `(feedId, guid)`. Enqueue a transcript-fetch sub-job and a chapters-fetch sub-job per episode that declares those elements.
- `packages/db/src/schema.ts` — `podcastFeeds.podcastGuid` covers the durable identifier; `podcastEpisodes.transcriptKey` and `podcastEpisodes.chaptersJson` cover the 2.0 surface. Add a future `podcastValueSplits` table if/when we wire up V4V payouts (out of scope for the first cut).
- `apps/api/src/routes/ingest-ddex.ts` is unrelated but shares the pattern: validate inbound payload, insert an `ingest_jobs` row with `kind = "podcast_rss"`, enqueue the worker job, return 202. Reuse that contract.

## Open Questions
- Do we honour `<podcast:locked>` strictly (no aggregator listing) or do we always list and just respect transfer-of-ownership semantics?
- Value-for-Value Lightning payouts: ship in v1 or v2? Custodial vs non-custodial wallet expectations differ wildly.
- Transcript storage cap per episode — what is reasonable for a 3-hour interview show?
- Do we accept community-contributed transcripts when the feed has none, and how do we attribute / moderate them?
