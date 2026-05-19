# Role 09 — CDN + Global Delivery

## Mission
Every byte the player consumes — HLS segments, FLAC progressive, cover art, waveform JSON — comes from a CDN edge close to the user, signed so it can't be hot-linked, byte-rangeable so the player can scrub, and cacheable enough that origin (MinIO / S3 in `infra/docker/docker-compose.yml`) sees < 5% of requests. Stay BYO-CDN: Cloudflare, Fastly, and Bunny are first-class; the same signed-URL contract works for all three so a self-host operator can pick whichever is cheapest in their region.

## Current Decision
- **Origin:** S3-compatible storage. Three buckets per `infra/docker/docker-compose.yml`: `encore-uploads` (private), `encore-audio` (CDN-fronted), `encore-images` (CDN-fronted).
- **Signed URLs:** the API issues short-lived signed URLs (HMAC-SHA256, 5–15 min TTL) for paid HiFi tracks and gated previews; non-personalized cover art and free-tier HLS *manifests* use long-cache, unsigned URLs with a path-based access token.
- **CDN providers:** Cloudflare (default, Workers for signing), Fastly (VCL for signing), Bunny (token authentication module). All three are configured via `packages/config/` (TBD); swapping is a deployment flag, not a code change.
- **Geo-routing:** anycast at the CDN edge — no DNS pre-routing. ClickHouse logs (Role 08) capture per-country bytes for capacity planning.
- **Anti-leech:** signed URL + Origin/Referer allowlist at the CDN + per-IP rate-limit on the manifest endpoint.
- **Byte-range:** every segment and the FLAC progressive object is range-friendly; HLS segments are 6 s (`-hls_time 6` in `buildFfmpegHlsArgs` from `packages/audio/src/index.ts`).
- **Prefetch:** the player (Role 16) requests the next track's manifest + first segment when ≤ 30 s of audio remain; segment responses ship with `Link: <next>; rel=preload` to hint the CDN.
- **Cache-key shape:**
  - Audio segments — `audio/{trackId}/{rung}/seg_{n}.aac` — immutable, 1-year TTL.
  - HLS manifest — `audio/{trackId}/master.m3u8` — short TTL (60 s) so loudness/ladder updates propagate.
  - FLAC progressive — `audio/{trackId}/master.flac` — immutable, 1-year TTL, signed URL when paid.
  - Cover art — `images/{releaseId}/cover_{size}.webp` — content-hashed key, instant invalidation on re-upload.
  - Waveform JSON — `audio/{trackId}/waveform.json` — small, public, edge-cacheable.

## Why this Choice
- **HMAC signed URLs** are vendor-neutral; every CDN supports verifying them at the edge without round-tripping origin.
- **BYO-CDN** matters for the AGPL self-host story (Role 10): no vendor lock-in keeps Encore installable anywhere a Postgres + S3 + a CDN exist.
- **6 s HLS segments** balance startup latency (< 1 s with the first segment in the manifest response) against per-segment overhead (~10–15% bitrate at 64 kbps).
- **Long-cache cover art** with content-hashed keys (via `coverArtKey` on `releases` in `packages/db/src/schema.ts`) lets the CDN cache art for years without busting on re-publish.

## Trade-offs
- **Signed URLs invalidate cache per user** for HiFi/paid content, so HiFi pays a higher origin egress cost than free streams. Acceptable: HiFi is gated behind a subscription.
- **Cloudflare Workers** for signing is cheap; **Fastly VCL** is faster but has a steeper learning curve; **Bunny** is the cheapest but with a smaller PoP footprint outside Europe.
- **Anti-leech via Referer** is defeatable; we layer it under signed-URL TTL so worst case a leech link works for 5 minutes.
- **Prefetch-on-30s** can waste bandwidth if the user skips; the player gates prefetch on `navigator.connection.saveData === false`.

## Performance & Scale Targets
- p95 segment first-byte at the edge: **< 60 ms** in NA/EU, **< 120 ms** elsewhere.
- Cache hit ratio across all audio segments: **≥ 95%** weekly.
- Origin egress: **< 5%** of total audio egress in steady state.
- Manifest startup (request → first segment buffered): **< 1.0 s** on a fast 4G link.
- Signed-URL signing latency: **< 5 ms p99** at the edge Worker / VCL.
- Cover-art LCP contribution on web: **< 200 ms** at p75.

## Open Questions
- Default CDN bundle for the SaaS tier (Cloudflare), or always require operators to BYO?
- HLS-LL for live / near-live — what's the segment size and PoP support story across the three CDNs?
- Per-artist egress dashboard so labels see CDN cost transparency?
- Multi-CDN failover — DNS-level (slow) or origin-shield-level (fast) — which do we adopt first?
- Image transformation at the edge (Cloudflare Images, Fastly IO) vs pre-rendered size variants in the bucket?
