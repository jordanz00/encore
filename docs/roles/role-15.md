# Role 15 — Metadata Standards

## Mission
Make Encore's metadata layer as good as the best music database on the open web — MusicBrainz — and as compatible with the commercial industry as DDEX requires. Every release, track, artist, and credit row should carry stable external identifiers (MusicBrainz IDs, ISRC, ISWC, UPC, EAN), audio-derived signals (BPM, key, mood, loudness), high-quality cover art, and structured credits — so search, recommendations, federation, and royalty reporting all have one source of truth. The role owns the schema, the enrichment pipeline, and the conventions every other role must follow.

## Today
The schema covers most of the surface: `tracks.isrc`, `tracks.iswc`, `releases.upc`, `artists.musicbrainzId`, `tracks.loudnessLufs`, `tracks.replayGainDb`, `tracks.peakAmplitude`, `tracks.embedding` (pgvector), and `trackCredits` (with `role`, `position`, optional `artistId`). What is missing: BPM, musical key, mood tags, EAN as a separate field from UPC, MusicBrainz IDs at the release and track level, a Cover Art Archive cross-reference, and a clear convention for whether credits come from DDEX or schema.org/MusicRecording. The audio pipeline is wired (`apps/worker/src/jobs/transcode.ts` exists) but does not yet run essentia or a similar feature extractor.

## Spec
1. **External identifiers (one set, kept in sync):**
   - `artists.musicbrainzId` — already present.
   - Add `releases.musicbrainzReleaseId` and `tracks.musicbrainzRecordingId`. MusicBrainz IDs are the canonical join key for cross-source enrichment.
   - `releases.upc` — already present; `releases.ean` — add (UPC is 12-digit, EAN is 13-digit; storing one as the other is a frequent industry bug).
   - `tracks.isrc` — already present; ISRC is the per-recording royalty key.
   - `tracks.iswc` — already present; ISWC is the per-composition key (different from ISRC) and feeds publishing-side reporting.
2. **Audio-derived signals (essentia, run in transcode worker):**
   - `bpm` (double precision), `keySignature` (varchar, e.g. `C#min`), `keyConfidence` (double precision), `moodTagsJson` (jsonb array of `{ tag, confidence }`).
   - Continue capturing `loudnessLufs`, `replayGainDb`, `peakAmplitude` (already in schema).
3. **Cover art.**
   - Primary: artist-supplied or distributor-supplied (`releases.coverArtKey`).
   - Fallback: Cover Art Archive lookup by `musicbrainzReleaseId`, with explicit attribution and a flag indicating the art is sourced from CAA, not the rights-holder.
4. **Credits.**
   - **Inbound from DDEX**: ERN-4 `Contributor` and `IndirectContributor` elements map directly to `trackCredits.role` (writer, producer, mixer, engineer, performer, featured artist, etc.). DDEX role list is the master vocabulary.
   - **Inbound from schema.org/MusicRecording**: when ingesting from CC sources or web scraping (Role 14), map `byArtist`, `producer`, `composer`, `lyricist` onto the same `trackCredits` shape.
   - Free-text `name` is allowed when no `artistId` exists (session musicians, one-off contributors).
5. **Lyrics.**
   - `tracks.lyrics` already exists. Lyrics are licensed content for commercial catalog — partner with a lyrics licensor (LyricFind, Musixmatch, Genius API tiers) and store the licence-terms reference in a `lyricsLicenseRef`. CC and PD sources can carry their own lyrics inline.

## Implementation Notes
- `packages/db/src/schema.ts` — extend `tracks` with `bpm`, `keySignature`, `keyConfidence`, `moodTagsJson`, `musicbrainzRecordingId`, `lyricsLicenseRef`; extend `releases` with `musicbrainzReleaseId`, `ean`, and a `coverArtSource` enum (`uploaded` | `distributor` | `cover_art_archive` | `cc_source`). Migration must be additive and nullable to avoid breaking existing rows.
- `apps/api/src/routes/ingest-ddex.ts` — when the ERN-4 parser lands, populate ISRC/ISWC/UPC/EAN, contributors, and the P-line/C-line. Today the route is a stub; capturing these fields is part of completing it (Role 11 owns the parser, this role owns the field contract).
- `apps/worker/src/jobs/podcast-poll.ts` — the parallel pattern for episode metadata extraction; same discipline applies (schema.org `PodcastEpisode` mapping, durable GUID, `podcast:guid`).
- The transcode worker should run essentia (or a comparable feature extractor) inline after the FLAC/HLS render, write features back into `tracks` with a single `UPDATE`, and emit a re-embed event for the recommendations pipeline.

## Open Questions
- MusicBrainz lookups: live on every ingest, or batched nightly to stay under their rate limit?
- Mood tag vocabulary — adopt MusicBrainz / Discogs tags, or train our own short ontology?
- Lyrics licensor pick — LyricFind vs Musixmatch vs build a CC-only lyrics surface and surface "lyrics unavailable" elsewhere?
- Cover Art Archive falls under CC-BY-NC-SA-style obligations in some cases — do we always store + serve from our CDN, or hot-link with attribution?
