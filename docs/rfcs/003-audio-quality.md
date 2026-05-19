# RFC 003 — Audio Quality

- **Status:** Draft
- **RFC Number:** 003
- **Authors:** Encore Architecture
- **Last Updated:** 2026-05-06
- **Related:** Role 07 (Ingest + Transcode), Role 09 (CDN + Global Delivery), Role 16 (Web Player)

## Status
Draft — open for review. Implementation tracked in `apps/worker/src/jobs/transcode.ts`; encoder contracts in `packages/audio/src/index.ts`; persisted fields in `packages/db/src/schema.ts`.

## Context
The streaming-quality bar in 2026 is set by Apple Music (lossless + spatial), Spotify (lossy + loudness-normalized), and Tidal (lossless + spatial). A free / self-host service that ships lossy-only or skips loudness normalization sounds noticeably worse on consumer headphones in any side-by-side test. To compete, Encore needs an HLS ladder that covers cellular through gigabit, a lossless tier for HiFi subscribers, and a defensible loudness story that respects artist intent rather than mashing every release to a single number.

The schema already commits us to this shape: `tracks.hlsKey`, `tracks.flacKey`, `tracks.waveformKey`, `tracks.loudnessLufs`, `tracks.replayGainDb`, `tracks.peakAmplitude` (`packages/db/src/schema.ts` ~lines 310–325). The ffmpeg helpers in `packages/audio/src/index.ts` already define the default ladder and ebur128 args. The worker stub at `apps/worker/src/jobs/transcode.ts` references this RFC inline. This document ratifies the choices.

## Decision

### HLS ladder

Four AAC rungs, codified as `DEFAULT_HLS_LADDER` in `packages/audio/src/index.ts`:

| Rung | Bitrate | Sample rate | Channels | Use case |
|---|---|---|---|---|
| 1 | 320 kbps | 44.1 kHz | 2 | Premium / WiFi |
| 2 | 256 kbps | 44.1 kHz | 2 | Default |
| 3 | 128 kbps | 44.1 kHz | 2 | Cellular |
| 4 |  64 kbps | 44.1 kHz | 1 | Save-Data / preview |

Segment length 6 s (`-hls_time 6` inside `buildFfmpegHlsArgs`). Master playlist + per-rung sub-playlists; HLS VOD (`-hls_playlist_type vod`).

### FLAC HiFi tier (pass-through)

When the upload is FLAC (`audio/flac` / `audio/x-flac` per `ALLOWED_AUDIO` in `apps/api/src/routes/uploads.ts`), the worker copies the bitstream into `audio/{trackId}/master.flac` verbatim — **no re-encode, no resample**. WAV uploads are encoded to FLAC at the source bit-depth / sample-rate. HiFi is gated by subscription tier (`subscriptionTier = 'hifi'` enum already in `packages/db/src/schema.ts`) and served via signed URL (Role 09).

### Loudness normalization (EBU R128)

We compute integrated LUFS, true-peak, and loudness-range during transcode (`buildEbuR128Args`). We do **not** re-encode to a fixed target; we **store the measurement** in `tracks.loudnessLufs`.

Players normalize at playback time to **−14 LUFS by default** (matching streaming convention), but the player's preference is **off by default per artist preference** — i.e. a release-level flag (`releases.metadata.normalize_default = false`) honored by the player. Listeners can toggle their own preference; artist preference is the *default* for that release. Artists who want the streaming-loud sound flip it on; mastering engineers who deliberately preserve dynamic range leave it off.

### ReplayGain (track + album)

Both **track gain** and **album gain** are computed and stored:

- `tracks.replayGainDb` (already in schema) — track gain in dB.
- `releases.metadata.replayGainAlbumDb` — written after the last track in a release transcodes; aggregates per ITU-R BS.1770-4.

Players ship with album gain selected for `releaseType` `album` / `compilation` and track gain for shuffled listening / playlists.

### Peak amplitude

True-peak in dBTP, stored in `tracks.peakAmplitude` (already in schema). Used by the player to set safe pre-gain when the listener disables normalization.

### Spatial audio (binaural render via libspatialaudio)

When the upload is multi-channel (5.1+ or ADM-BWF), we run **libspatialaudio** (LGPL — compatible with our AGPL distribution) to produce a binaural stereo render at 44.1 kHz. Output goes to `audio/{trackId}/spatial/binaural.m3u8` as an additional ladder, served only to clients that opt in.

**Dolby Atmos** (object-based) is **out of scope.** Atmos requires a Dolby license + certified encoder pipeline; the licensing terms are AGPL-incompatible. We document the limit publicly and may add an Atmos pipeline later as a non-default, license-gated commercial build.

### Gapless playback

A boolean `tracks.metadata.gaplessNext = true` is written by the transcoder when (a) consecutive tracks have matching sample rate and channel count and (b) the source signals gapless intent (CD-DA index, FLAC `--no-padding`, BWF `BextChunk` continuous-time-stamps). The player (Role 16) reads this flag to swap audio elements without a buffer flush.

## Alternatives
- **Opus instead of AAC.** Rejected for HLS: Apple's HLS Opus support is still patchy in fielded iOS versions. Re-evaluate when Apple ships full Opus support across the install base.
- **MP3 fallback.** Rejected: AAC at 64 kbps beats MP3 at 64 kbps on every public listening test; we'd rather keep one codec.
- **Always-on −14 LUFS normalization.** Rejected: artists routinely complain that streaming services flatten dynamic range; making normalization artist-controllable is a differentiator.
- **Sony 360 Reality Audio / Auro-3D.** Rejected for v1: same licensing tangle as Atmos, smaller install base.
- **Five-rung ladder (add 192 kbps).** Rejected: marginal quality gain over 256 kbps doesn't justify the extra storage + CDN cost.

## Consequences
- The transcode pipeline runs two ffmpeg passes (HLS + ebur128) plus an optional libspatialaudio render. CPU budget per minute of audio: ~5–8 vCPU·s; matches Role 07's p95 < 35 s for a 4-minute track.
- Storage per 4-minute track: ~6 MB (HLS), ~30 MB (FLAC), ~3 MB (binaural HLS) — call it ~40 MB worst-case. CDN cache-keys (Role 09) handle the egress story.
- Players (Role 16, Role 17) gain a normalization toggle and a HiFi-eligibility check; both are testable without audio asset changes.
- DDEX-ingested releases (RFC 002) inherit the same pipeline; distributor preference flags map to the `normalize_default` boolean.
- Self-host single-binary mode (Role 10) ships only rungs 2 + 3 by default to fit a 1 vCPU host; documented in the README.

## Open Questions
- Add a fifth "HiFi-stream" HLS rung (FLAC-in-fMP4) for clients that can't do progressive download of the full FLAC?
- Expose the loudness measurement to listeners ("This album is louder than 87% of releases on Encore")?
- libspatialaudio HRTF — single default in v1, user-pickable HRTF profiles in v2?
- Gapless detection on user uploads with no metadata — fingerprint boundary samples, or trust artist input only?
- Atmos: revisit once Dolby's "open spatial" alternatives mature, or build a license-gated commercial fork that lives outside the AGPL build?
- Per-listener loudness target (−14 / −16 / −18 LUFS) as an accessibility setting (Role 20)?
