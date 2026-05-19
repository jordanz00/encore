# Encore Roadmap

This is the high-level roadmap. Detailed design intent for each item lives in [`docs/rfcs/`](docs/rfcs/) and per-role briefs in [`docs/roles/`](docs/roles/).

> **Ship-week sprint:** the immediate near-term plan is in [`SHIP-PLAN-7-DAYS.md`](SHIP-PLAN-7-DAYS.md) — public-beta launch in 7 days with realistic scoping. Most v0.1 and parts of v0.2 land during ship week; the rest of this roadmap is the post-launch arc.
>
> Strategic context:
> - [`ARTIST-INCOME-GUARANTEE.md`](ARTIST-INCOME-GUARANTEE.md) — **the "no starving artists" design contract** — six revenue streams default-on, Discovery Dividend, Artist Wallet, Encore Day, Working Musician Stipend, anti-starvation schema invariants
> - [`COMPETITORS.md`](COMPETITORS.md) — every player in the space and where Encore wins
> - [`BRAND-POSITIONING.md`](BRAND-POSITIONING.md) — the public-comms voice and the four-pillar pitch
> - [`ARTIST-ECONOMICS.md`](ARTIST-ECONOMICS.md) — the financial design contract
> - [`PLATFORM-SUCCESS-STRATEGY.md`](PLATFORM-SUCCESS-STRATEGY.md) — how Encore avoids the failure modes that killed Resonate, Audius, and Tidal's UCPS attempt
> - [`ARTIST-PAIN-AUDIT.md`](ARTIST-PAIN-AUDIT.md) — 16 specific 2024–2026 artist grievances and the code-level fix for each
> - [`GLOBAL-LAUNCH-PLAYBOOK.md`](GLOBAL-LAUNCH-PLAYBOOK.md) — regional payment rails, i18n, censorship resilience

## v0.0.x — Scaffold (current)

Goal: a credible foundation a small team can extend.

- [x] Monorepo (pnpm + Turborepo)
- [x] Postgres + Drizzle schema (users, artists, releases, tracks, playlists, plays, comments, sales, payouts, podcasts, ingest, ads, moderation)
- [x] Fastify API with auth, uploads, releases, tracks, playlists, plays, follows, search, recommendations, podcast ingest, DDEX ingest (real HMAC + DSR), payments stub, ads stub, federation (real), radio
- [x] BullMQ worker with **real** transcode (ffmpeg HLS ladder + FLAC + EBU R128 + waveform), **real** podcast RSS (Podcasting 2.0), **real** DDEX delivery, **real** ActivityPub outbox fanout (HTTP Signatures), embeddings stub
- [x] `@encore/ingest-ddex` — ERN-4 parser + HMAC verify + DSR usage report generator
- [x] `@encore/ingest-podcast` — RSS + Podcasting 2.0 parser (chapters, transcripts, value, locked) + OPML import
- [x] `@encore/activitypub` — RSA keypair, Person actor, Webfinger, HTTP Signatures sign + verify
- [x] `@encore/recs` — hybrid recommendations (CF + pgvector cosine + editorial + fresh-crate + sliders) + radio stations
- [x] `@encore/seed-catalog` — Free Music Archive, Internet Archive Live Music Archive, Jamendo importers + `pnpm seed:catalog`
- [x] Subscription entitlements (Free / Premium / Family / Student / HiFi) + quality variant gating
- [x] Web app (Next.js 15: landing, discover, artist, release, track, playlist, podcast, upload, library, search, editorial, login)
- [x] Mobile shell (Expo + RN, CarPlay/Android Auto entitlements declared)
- [x] Desktop shell (Tauri 2)
- [x] Editorial CMS shell
- [x] Docker Compose (postgres, redis, minio, meilisearch, mailhog)
- [x] AGPL-3.0 LICENSE
- [x] Governance + funding + security + accessibility + roadmap docs
- [x] 30 role briefs + 8 RFCs
- [x] `CATALOG-PATHS.md`, `ARTIST-ECONOMICS.md`, `PLATFORM-SUCCESS-STRATEGY.md`, `ARTIST-PAIN-AUDIT.md`, `GLOBAL-LAUNCH-PLAYBOOK.md`, `COMPETITORS.md`, `BRAND-POSITIONING.md`, `SHIP-PLAN-7-DAYS.md`

## Ship-week sprint (the next 7 days) — Public Beta

Goal: `encore.audio` is live, `beta.encore.audio` is a working reference instance, the four strategy docs are public, ≥5 cornerstone artists are onboarded, and the project is launched on HN + Mastodon + Bluesky + the indie music press. Full day-by-day plan in [`SHIP-PLAN-7-DAYS.md`](SHIP-PLAN-7-DAYS.md).

- [ ] **Day 1:** Domain + production stack on Hetzner + brand identity + marketing site
- [ ] **Day 2:** CC seed catalog live (600+ tracks) + Stripe test-mode payments wired + Stripe Connect KYB submitted + NLnet NGI0 proposal filed
- [ ] **Day 3:** First 5 cornerstone artists onboarded with at least 2 releases each
- [ ] **Day 4:** Mastodon federation interop verified + Subsonic API ships (Symfonium / play:Sub compatible) + Funkwhale interop
- [ ] **Day 5:** a11y pass + DMCA workflow + ToS/Privacy/AUP + status page + beta invite-code gate
- [ ] **Day 6:** Launch blog post + press kit + outreach list drafted
- [ ] **Day 7:** Public beta launch — HN, Mastodon, Bluesky, Reddit, press email blast

## v0.1 — First runnable demo and funded entity

Goal: a maintainer can play a track end-to-end, locally, with audio actually transcoded; Encore has a fiscal sponsor and a filed grant proposal.

- [ ] Better-Auth real wiring (today the `/auth` routes use a hand-rolled session for simplicity)
- [ ] Wavesurfer.js integration in the web player (waveform display)
- [ ] HLS.js fallback for non-Safari browsers
- [ ] **Apply to NLnet NGI0 Commons Fund** before 1 June 2026 deadline ([details](PLATFORM-SUCCESS-STRATEGY.md#§3))
- [ ] **Select fiscal sponsor** (Commons Conservancy or Open Source Collective)
- [ ] Register `encore.audio` + `encore.audio`; ship a coming-soon site

## v0.2 — First federated artists

- [ ] Per-artist keypair stored in `actor_keys` table (today minted lazily for scaffold demo)
- [ ] Federation tested with at least one Mastodon and one Funkwhale instance
- [ ] Outbox publish-on-release-publish hook (auto-fire Create(Note) when a release transitions to `published`)
- [ ] Remote follower table + inbox accept handling for Follow / Like / Announce
- [ ] **Onboard the first 10 cornerstone artists by hand** ([details](PLATFORM-SUCCESS-STRATEGY.md#§6))

## v0.3 — First payments + Artist Wallet + Discovery Dividend ([details](ARTIST-INCOME-GUARANTEE.md))

- [ ] **Artist Wallet** (`artist_wallets`) + ledger (`wallet_ledger`) — money lands in artist wallet *before* the platform sees it; weekly auto-cashout default
- [ ] Stripe Connect Express onboarding flow
- [ ] Wise Business payout for countries Stripe cannot reach (Nigeria, Pakistan, Argentina, Bangladesh, etc.)
- [ ] Direct sale checkout (single track, single release, name-your-price) — fires `walletLedger` row immediately on Stripe webhook
- [ ] **Tips** (`tips` table) — one-off + recurring, Stripe + Lightning + Wise + mobile money rails
- [ ] Lightning V4V receive for tips
- [ ] **Weekly auto cash-out** (Friday 00:00 UTC) across all rails
- [ ] One-click tax-ready statement export (1099-K / T4A / EU VAT MOSS / India GST)
- [ ] Pay-what-you-want overage → 100% to artist
- [ ] Songwriter Dashboard scaffold (per-track mechanical royalty visibility, ISWC linkage, co-writer splits)
- [ ] **Discovery Dividend pool** (`discovery_dividend_periods` / `discovery_dividend_payouts`) — every verified play earns from the ad + 10%-of-subs pool. Settlement worker `apps/worker/src/jobs/discovery-dividend-settle.ts`
- [ ] **Encore Day** (`encore_day_periods`) — first-Friday-of-month +25% matching pool on direct sales + tips, "+ matched" badge at checkout
- [ ] Six-stream dashboard at `/dashboard` consolidating direct sales / tips / streaming / Discovery Dividend / sync / merch+live

## v0.4 — User-centric subscription payouts + transparency reports

- [ ] User-centric payout job (`apps/worker/src/jobs/payouts.ts`) writes to `subscription_allocations`
- [ ] Per-listener subscription pool allocation (your $9.99 → only the artists you played)
- [ ] No 1,000-stream gate (DB CHECK: `discovery_dividend_period.per_play_rate_micro_cents > 0` when any plays exist)
- [ ] Payout statement: per-listener-subsidy breakdown so artists see exactly who paid them
- [ ] Distributor opt-out flag for licensors who insist on pro-rata (they keep direct-sale revenue only)
- [ ] **Quarterly transparency report** at `encore.audio/transparency` — every pool, every disbursement, every Discovery Dividend rate, every stipend (post-Year 1) ([details](ARTIST-INCOME-GUARANTEE.md#§9))
- [ ] **Anti-starvation audit views**: `v_audit_wallet_credit_latency`, `v_audit_wallet_unexplained_decreases`, `v_audit_wallet_reasons`, `v_audit_user_centric_allocation`, `v_audit_discovery_dividend` ([details](ARTIST-INCOME-GUARANTEE.md#§6))

## v0.5 — First DDEX delivery + Sync licensing marketplace

- [ ] Pilot DDEX ingest with a small indie-friendly distributor (Amuse, RouteNote, or similar)
- [ ] Per-distributor admin onboarding flow + HMAC secret rotation
- [ ] Monthly DSR usage report mailout
- [ ] At least one Merlin-affiliated label onboarded directly
- [ ] **Sync licensing marketplace** (`sync_license_opt_in` / `sync_license_usage`) — Tier 1 ($5/use indie podcast), Tier 2 ($50/use indie film), Tier 3 ($500/use commercial)
- [ ] Sync browse + filter UI for licensees (podcasters, indie filmmakers, game devs)
- [ ] Per-artist brand-exclusion list (no tobacco / weapons / fast-food etc. without explicit opt-in)
- [ ] 85% to artist / 15% to foundation legal-ops sub-pool (no platform fee — the 15% covers licensee dispute resolution)

## v0.6 — Recommendations engine training + Subsonic + Live + Merch

- [ ] iALS collaborative filtering retrained nightly (today the CF shim uses online co-likes)
- [ ] CLAP / OpenL3 audio embeddings via the worker (RFC 004)
- [ ] pgvector HNSW index on `tracks.embedding`
- [ ] Editorial slot rotation in admin
- [ ] Daily mix + weekly fresh crate generation
- [ ] **Subsonic API parity** — full `getArtists`, `getAlbumList2`, `getAlbum`, `getSong`, `stream`, `download`, `getCoverArt`, `scrobble`, `search3`, `getPlaylists` endpoints in `apps/api/src/routes/subsonic.ts` so the 50+ existing Subsonic-compatible mobile apps work with Encore (see [`COMPETITORS.md`](COMPETITORS.md) Tier 5)
- [ ] Official partner outreach to top Subsonic mobile apps (Symfonium, play:Sub, DSub) — offer integration testing slot
- [ ] **Live events** (`live_events`) — Bandsintown + Songkick sync; native event form; auto-render on artist profile + city-aware listener notifications
- [ ] **Merch** (`merch_items` / `merch_sales`) — Printful + Printify passthrough at 0% platform fee, native fulfillment option for shipped-from-artist items

## v0.7 — Mobile beta

- [ ] Expo EAS Build pipeline
- [ ] react-native-track-player integrated
- [ ] Offline cache for purchases
- [ ] TestFlight + Google Play internal track
- [ ] CarPlay + Android Auto runtime tested on real hardware

## v0.8 — Desktop beta

- [ ] Tauri builds for macOS, Windows, Linux
- [ ] System media keys
- [ ] Mini-player window

## v0.9 — Dual-publish helpers (the migration ramp)

- [ ] One-click Bandcamp mirror import (artist authorizes; their catalog auto-mirrors)
- [ ] One-click SoundCloud mirror import (same model)
- [ ] Right-of-return ToS clause: catalog export ZIP includes audio, metadata, sales receipts, fan list

## v0.10 — Global payment rails (regional)

- [ ] M-Pesa payout (Kenya, Tanzania via Safaricom Daraja API)
- [ ] MTN MoMo payout (Ghana, Uganda, Côte d'Ivoire, Cameroon, Rwanda)
- [ ] Flutterwave (30+ African countries — cards + mobile money + bank)
- [ ] Razorpay + UPI payout (India)
- [ ] Pix payout (Brazil via licensed PSP)
- [ ] MercadoPago (Argentina, Chile, Mexico, Colombia, Peru)
- [ ] Multi-currency artist wallet with transparent FX (≤0.5% conversion fee)
- [ ] Optional stablecoin opt-in (USDC/USDT on Lightning/Liquid) for hyperinflation economies

## v0.11 — Internationalization

- [ ] Weblate self-hosted instance at `translate.encore.audio`
- [ ] Tier 1 launch languages (9): EN, ES, PT-BR, FR, DE, IT, PL, NL, JA
- [ ] Tier 2 launch languages (13): HI, BN, PA, TA, TE, MR, UR, AR, TR, VI, ID, TH, TL
- [ ] RTL infrastructure for AR / HE / FA / UR UI
- [ ] Content-language-aware discovery (listener preferred-languages → weighted recs)
- [ ] Transliteration search (e.g. Devanagari ↔ Latin for Hindi artist names)

## v0.12 — Regional reference instances

- [ ] `na.encore.audio` (North America — Foundation)
- [ ] `eu.encore.audio` (Europe — Frankfurt)
- [ ] `sa.encore.audio` (South America — grant to Brazilian operator)
- [ ] `af.encore.audio` (Africa — grant to Lagos or Nairobi operator)
- [ ] `as.encore.audio` (South Asia — grant to Bengaluru or Mumbai operator)
- [ ] `ea.encore.audio` (East Asia — grant to Singapore or Tokyo operator)
- [ ] `oc.encore.audio` (Oceania — grant to Sydney operator)
- [ ] Tor `.onion` service live for every reference instance
- [ ] Federation bridge mode (mirror artists from blocked instances)

## v1.0 — Public launch + Working Musician Stipend

- [ ] All v0.x items shipped + stable
- [ ] App Store + Play Store + Microsoft Store submitted
- [ ] Editorial team funded and active
- [ ] Trust + safety team funded
- [ ] Infrastructure budget covered for ≥12 months
- [ ] Foundation fiscal sponsorship secured (Phase 2 of governance)
- [ ] WCAG 2.2 AA audit passed
- [ ] Public security audit completed
- [ ] **Working Musician Stipend** (`stipend_enrollments` / `stipend_disbursements`) launched — Year-2 baseline $5–$15/mo for qualifying active artists, scaling to $50/mo Living Wage tier as foundation funding matures ([details](ARTIST-INCOME-GUARANTEE.md#§5))
- [ ] First public Encore Day with ≥$10k in match-pool funded, ≥100 artists receiving matched tips

## v1.x and beyond

- Apple Watch + Wear OS apps
- Sonos S2 add-services certification
- Chromecast receiver
- CarPlay full submission (after Apple MFi-style review)
- Merlin onboarding
- Major-label distributor relationships (multi-year project; capital-dependent)

## Things we will not build

These are the **anti-success** commitments from [`PLATFORM-SUCCESS-STRATEGY.md`](PLATFORM-SUCCESS-STRATEGY.md) §9. They are non-negotiable; any contributor PR introducing them will be closed without merge.

- Any feature that depends on selling listener data
- Pay-to-promote algorithmic boosts (Spotify Discovery Mode equivalent — the artist takes a per-stream rate cut for promotion)
- Behavioral ad targeting (contextual only)
- A native token of any kind. No "creator coin," "social token," or governance token. **If Encore ever tokens, the AGPL fork is the real Encore.**
- Pay-to-prioritize subscription pool distribution
- A 1,000-stream cliff or any similar minimum-volume payout gate
- Vendor lock-in: bulk catalog export is a permanent ToS right
- Major-label veto over user-centric payouts
- DRM beyond what hardware playback (CarPlay, AirPlay) inherently requires
- A general AI content classifier for moderation
