# Role 02 — Apple Music Deep Audit

## Mission
Audit Apple Music as the "premium-feel" reference: lossless ALAC, Dolby Atmos / spatial, Apple Music Classical as a separate app, deep editorial radio, and the strongest ecosystem integrations of any DSP (CarPlay, AirPods, HomePod, watchOS, AirPlay 2). Identify what Encore must match to feel like a credible alternative for audiophiles and Apple-native listeners, and what we deliberately won't replicate. Findings feed Role 16 (web), Role 17 (mobile), Role 18 (desktop / Tauri), Role 19 (car / watch / cast), and the audio columns in `packages/db/src/schema.ts` (`tracks.flacKey`, `tracks.hlsKey`, `tracks.loudnessLufs`, `tracks.replayGainDb`).

## Keep
- **Lossless as a default for HiFi.** ALAC up to 24-bit / 192 kHz on Apple's side. We already model `tracks.flacKey` (progressive FLAC for HiFi tier) and have a `hifi` tier in `subscriptionTier`. The `loudnessLufs` and `replayGainDb` columns let us play loudness-normalised lossless without crushing dynamic range.
- **Spatial / Atmos as a creator-controlled extra**, not a tier upsell. Surface as a badge on the track, not gated behind a more-expensive plan.
- **Editorial radio shows** with named hosts and a rebroadcast schedule. Maps cleanly to `playlists.isEditorial = true` plus a podcast-shaped surface in `podcastFeeds` for show feeds.
- **Lyrics done well** — time-synced, swipeable, and a quotable share card. We already store `tracks.lyrics` and reserve a `waveformKey` for the player; lyric anchoring belongs alongside in `packages/player/`.
- **Curator-led genre destinations** (e.g. dedicated jazz / classical / hip-hop "rooms") rather than algorithm-only browsing.
- **Strong "Now Playing" everywhere** — `MPNowPlayingInfoCenter` parity on iOS / macOS, MPRIS2 on Linux, SMTC on Windows, all owned by Roles 17 and 18.
- **Dedicated Classical app pattern.** Classical metadata (work, movement, conductor, ensemble, period, instrumentation) does not fit the pop schema. Apple shipped a separate app to admit this.

## Drop
- **Walled-garden ecosystem assumptions.** Apple Music is genuinely best on Apple hardware and tolerated elsewhere. Encore's promise is the inverse: equally good on every OS and form factor.
- **DRM-locked downloads.** Owned downloads on Apple are tethered to subscription. Our `sales` model means a purchased download is a real owned file (FLAC + sidecar metadata).
- **Opaque editorial selection** with no public criteria. We document editorial submission and selection in the admin app (`apps/admin/`).
- **Closed source player + closed protocol.** Our player lives in `packages/player/` under AGPL.
- **Hidden ranking signals**. Our recs are documented in `docs/rfcs/004-recommendations.md` and explainable per-row.

## Recommendations for Encore
1. **HiFi tier honestly defined.** `subscriptionTier = 'hifi'` unlocks progressive FLAC playback via `tracks.flacKey` and surfaces a "Lossless 24/96" or "24/192" badge driven by the master file the artist actually uploaded — never upscaled. Worker job in `apps/worker/src/jobs/` records true bit depth / sample rate alongside loudness.
2. **Spatial / Atmos as a metadata flag, free to all listeners.** Add `isSpatial` plus `spatialFormat` to `releases` or `tracks` (schema change tracked in `docs/rfcs/`). No tier wall; the artist chose to release it that way.
3. **Loudness normalisation respected by default.** Player honours `loudnessLufs` / `replayGainDb` (already modelled), with a one-click off for audiophile listeners.
4. **Classical-aware metadata extension** — separate `work`, `movement`, `composerArtistId`, `conductor`, `ensemble`, `period` columns or a dedicated `classical_works` table; deferred behind a future RFC, but the schema review goes through this role.
5. **Editorial radio shows** modelled as an editorial playlist + a podcast-style schedule entry. Reuse `podcastFeeds` / `podcastEpisodes` shape for "Show #42 — June 2026."
6. **Ecosystem coverage** owned end-to-end by Role 19 — CarPlay, AirPlay 2, AAuto, Wear OS, Sonos, Cast — but the metadata they all read (artwork at 1024×1024, normalised loudness, captions for music videos) is owned here and validated against Apple's HIG.
7. **Lyrics-as-a-share** export card pulled from `tracks.lyrics` with explicit licence flags before share is enabled.

## Open Questions
- Atmos / spatial ingest: do we accept ADM BWF and re-package, or only accept pre-mastered Atmos masters from distributors (DDEX-tagged via `ingestSourceKind = 'ddex'`)?
- Classical metadata: ship a v1 extension to `tracks` / `releases`, or model `classical_works` as its own table linked many-to-many?
- Do we attempt Apple Music–parity radio shows pre-launch, or wait until we have ≥ 50 editorial curators?
- Mac App Store distribution (Role 18) — do we accept the 30 % cut for the discovery, or stay direct-download only?
- Lyrics licensing — Musixmatch / LyricFind partnership vs artist-supplied only? Artist-supplied is cheaper but coverage is thin for catalog ingest.
