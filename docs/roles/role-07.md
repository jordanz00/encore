# Role 07 — Audio Ingest + Transcode Pipeline

## Mission
Own the path that takes a raw artist upload from "PUT to S3" all the way to "playable on the CDN," reliably, idempotently, and with the audio quality contract in RFC 003 honored every time. The pipeline straddles `apps/api/src/routes/uploads.ts` (presign + finalize), `apps/worker/src/jobs/transcode.ts` (the BullMQ worker), and `packages/audio/src/index.ts` (ffmpeg-arg builders + result types). Failures here are the most user-visible failure mode short of the player itself; correctness wins over throughput.

## Current Decision
1. **Upload:** clients call `POST /uploads/presign` (`apps/api/src/routes/uploads.ts`); the route validates content-type against `ALLOWED_AUDIO`, enforces `MAX_AUDIO_BYTES` (1 GiB), and returns a 15-minute presigned PUT URL keyed under `audio_master/{userId}/{uuid}.{ext}`.
2. **Finalize:** client `POST /uploads/finalize { key }` checks the ownership prefix, then enqueues `audioTranscode` on BullMQ with `attempts: 3, backoff: exponential, delay 5000ms`.
3. **Worker:** `apps/worker/src/jobs/transcode.ts` consumes the job (concurrency 2 today). Pipeline: download master → ffmpeg HLS ladder via `buildFfmpegHlsArgs` / `DEFAULT_HLS_LADDER` (320/256/128/64 kbps AAC) → ffmpeg ebur128 via `buildEbuR128Args` → FLAC pass-through when source is lossless → waveform JSON precompute → optional binaural spatial render (RFC 003).
4. **Persist:** worker updates `tracks.hlsKey`, `flacKey`, `waveformKey`, `loudnessLufs`, `replayGainDb`, `peakAmplitude`, `durationMs` in `packages/db/src/schema.ts`.
5. **CDN:** outputs land in the `encore-audio` bucket (`infra/docker/docker-compose.yml`) and are served via a signed-URL CDN edge owned by Role 09.

## Why this Choice
- **Direct-to-S3 PUT** keeps the API stateless and removes a 1 GiB body from the Fastify hot path.
- **BullMQ on Redis** gives idempotent retries with backoff, named queues (`QUEUE_NAMES.audioTranscode`), and a deterministic pause/resume story for incident response — without standing up Kafka.
- **One transcoder, ffmpeg.** Argument generation is centralized in `packages/audio/src/index.ts` so a flag change is one PR; the worker is a thin orchestrator.
- **Stable job keys** (`{ key, userId, trackId }`) make retries safe: the same upload key always produces the same outputs at the same prefix.

## Trade-offs
- **Presigned PUT** can't enforce content-type byte-for-byte; we re-validate by sniffing magic bytes in the worker before ffmpeg runs.
- **ffmpeg shell-out** means version drift between dev and prod; we pin via the worker Dockerfile and assert the version on worker boot.
- **BullMQ concurrency 2** caps per-worker throughput; we scale horizontally rather than risk one long transcode starving short ones.
- **Virus scan** (ClamAV sidecar) is an extra hop; we run it in parallel with the magic-byte check, not before download.
- **Idempotency on retry** requires the worker to delete partial output prefixes before writing — implemented as `DELETE` of `audio/{trackId}/` then write-fresh.

## Performance & Scale Targets
- p95 transcode for a 4-minute 24-bit/96 kHz FLAC: **< 35 s** wall clock on a 4-vCPU worker, including download + upload.
- **Idempotency:** re-finalizing the same `key` produces zero duplicate output objects.
- **Failure budget:** < 0.5% of uploads dead-letter; the rest succeed within 3 attempts.
- **Time-to-playable** (presign → HLS manifest reachable on CDN): **< 60 s** for a 4-minute track.
- Worker fleet must drain a 10 000-track ingest day (Bandcamp Friday-class) within 6 hours.
- Magic-byte content sniff + ClamAV path completes in < 3 s for files ≤ 200 MB.

## Open Questions
- ClamAV vs cloud scan API — ship the sidecar in the default `docker-compose.yml`, or gate behind a feature flag for self-hosters who don't want the RAM cost?
- Pre-compute HLS-LL (low-latency) for live / near-live releases now, or save for a later RFC?
- Re-transcodes (ladder change, new spatial render) — reuse `track.id` or version under a new `tracks_versions` table?
- How do we surface ffmpeg warnings (clipping, sample-rate mismatch) back to artists without scaring them?
- Resumable uploads (tus / S3 multipart) for slow connections — v1 must-have or v2 nice-to-have?
