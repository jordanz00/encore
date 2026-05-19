# Role 05 — OSS & Alt Landscape Audit

## Mission
Audit the open-source, federated, and "alternative DSP" attempts that came before Encore — Audius, Funkwhale, Resonate, Jellyfin Music, Navidrome, Mixcloud, Tidal HiFi — and translate their wins and (loud) failures into concrete decisions for our schema, federation strategy, and scaling plan. This role is the honesty filter: the OSS music space is littered with good ideas that hit governance, scale, or moderation walls. We name those walls so we don't walk into them.

## Keep
- **Funkwhale's federation model** (ActivityPub, per-pod admins, exportable libraries) is the right shape for Encore's "federated-capable" promise. We already store `artists.actorIri`, `artists.inboxUrl`, and `releases.objectIri` in `packages/db/src/schema.ts`, with a route stub at `apps/api/src/routes/federation.ts`.
- **Resonate's `#stream2own`** (a small fee per play, capped after N plays = ownership) is the most interesting payout model in the alt space. Even if we don't ship it as the default, the maths fits the existing `sales` + `plays` schema.
- **Navidrome / Jellyfin's "your library, your server"** ergonomics. Local-first listeners exist and are loyal; Encore's self-hosted single-tenant deployment via `infra/docker/` and `infra/helm/` is a deliberate offer to that audience.
- **Subsonic API compatibility surface** (used by Navidrome, Airsonic, and a long tail of clients). A read-only Subsonic-compatible adapter on top of `apps/api/src/routes/tracks.ts` and `playlists.ts` opens a working third-party client ecosystem on day one.
- **Mixcloud's PRO-respecting licensing** for DJ mixes (pays performance societies; no skipping on free tier). Concept worth keeping; mechanic ("no skip") is hostile and we drop it (see Role 04).
- **Audius's mobile-first, comment-rich UX** — independent of its tokenomics, the app design lessons are real.
- **Tidal's lossless-as-default** posture (Apple Music caught up; Tidal made the case). Already supported via `tracks.flacKey` and the `hifi` subscription tier.

## Drop
- **Audius's wash-trading and token-incentive model.** The `$AUDIO` token has been credibly linked to repeated wash-trading and bot-driven play-count inflation; a chunk of "growth" went to gaming the reward pool. Encore pays artists in fiat through `payouts` + `sales`. No platform token, no on-chain "rewards", no leaderboard incentives that reward bots over listeners.
- **Funkwhale's moderation reality.** Per-pod moderation works socially at small scale and breaks under any volume — the project itself is small (low-single-digit core devs, intermittent release cadence), and federated moderation tooling is thin. We invest seriously in `moderationReports`, `dmcaNotices`, and admin tooling in `apps/admin/` before we open federation broadly.
- **Resonate's persistent under-scale.** The co-op has restructured / paused / restarted multiple times since 2015 and never approached DSP-grade catalog. `#stream2own` is great in theory; without catalog and operations behind it, listeners can't use it as their daily driver. We treat Resonate's payout model as inspiration but plan our own catalog (DDEX distributors → Merlin → CC seed) so a listener can actually live in Encore.
- **Jellyfin Music's afterthought UX.** Jellyfin is a video server with a music tab; the music UX (queue, lyrics, edge cases) is second-class. We don't build "music in a video server" — we build the inverse.
- **MQA-as-a-marketing-claim.** Tidal pushed MQA hard, deprecated it after technical and business pushback, and re-anchored on FLAC. We use plain FLAC + ALAC and document bit depth / sample rate honestly on each `tracks` row.
- **Closed-source "open" platforms.** Several "alt DSP" plays publish manifestos but not source. AGPL-3.0 means our server changes are also open.

## Recommendations for Encore
1. **Subsonic compatibility adapter** on top of the existing API surface. Documented under a future `docs/rfcs/00X-subsonic.md`. Makes Navidrome / Airsonic clients work against an Encore instance immediately, and gets us battle-testing for free.
2. **Federation rolled out in waves.** Wave 1: outbound `objectIri` publishing only (release announcements). Wave 2: inbound follows. Wave 3: full library exchange + cross-instance plays counted in `plays`. Each wave gated on moderation tooling shipping in `apps/admin/`.
3. **Optional `stream2own` mode per-artist.** A boolean on `releases` (`enableStream2Own`) plus a per-play micropayment that accumulates against the release price floor; once the listener has paid the floor, the release flips to "owned" via a synthetic `sales` row. Schema-wise, the columns are mostly already there.
4. **No platform token, ever.** Documented as an architecture invariant alongside the existing list (RFC 001 captures this).
5. **Self-host first-class.** Single-tenant Docker compose stack at `infra/docker/`, Helm chart at `infra/helm/`, and a documented "small instance" path that doesn't need Meilisearch + pgvector to function (read-only fallback search via Postgres `gin_trgm_ops`, which is already on `tracks_title_trgm_idx` and `artists_name_trgm_idx`).
6. **Honest scale-readiness.** We don't claim Spotify-grade catalog on day one. We seed with CC / Public Domain (Free Music Archive, Internet Archive), open indie upload, then onboard DDEX distributors, then pursue Merlin once the operational story is real.
7. **Moderation budget treated as a product budget.** Trust & safety staffing planned alongside engineering, not deferred.

## Open Questions
- Funkwhale's pod-to-pod content exchange has known consistency / dedupe issues — do we adopt their wire format with extensions, or define a clean ActivityPub object schema in a future RFC?
- Subsonic adapter scope — read-only library + playback only, or also the comment / repost surfaces? (Comments aren't in the Subsonic spec.)
- `stream2own`: does the per-play micropayment go through Stripe each play (fees crush it), or accumulate in a wallet that flushes on threshold?
- How loudly do we publicly contrast Encore with Audius? Useful framing vs. unnecessary fight.
- Is there a clean licensing path to ingest selected Internet Archive / FMA seed catalog without inheriting their metadata-quality issues, or do we hand-curate the seed?
