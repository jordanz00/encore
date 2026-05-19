# Catalog Paths — How Encore Gets a Real Catalog Without Hundreds of Millions

The single hardest objection to a Spotify competitor is "you can't license the major-label catalog." That's true — and irrelevant. There are five legal, scalable paths to a real catalog. Encore implements all five.

This document is the master index. Each path links to its RFC, the relevant code, and the ops next steps to turn it on.

## TL;DR by path

| # | Path | Day-1 catalog size | Cost to Encore | Implementation status |
|---|---|---|---|---|
| 1 | **Indie artist upload** | 0 → ∞ (per signup) | $0 | Wired (`apps/web/upload`, `apps/api/uploads`, `apps/worker/transcode`) |
| 2 | **DDEX distributor ingest** | Millions, after partnerships | $0 | Real parser + HMAC + DSR ([RFC 002](docs/rfcs/002-ddex-ingest.md)) |
| 3 | **Podcast RSS** | Millions of podcasts day one | $0 | Real RSS + Podcasting 2.0 parser |
| 4 | **CC + Public Domain seed** | ~150k FMA + Internet Archive + Jamendo | $0 (storage egress only) | Real importers, `pnpm seed:catalog` |
| 5 | **Merlin** (indie label aggregator) | Adds ~20k labels: Beggars, Domino, Sub Pop, Secretly | Membership pathway only | Spec + onboarding flow ([RFC 002](docs/rfcs/002-ddex-ingest.md)) |
| — | Major labels (UMG / Sony / WMG) | Roadmap year 3+ | Hundreds of millions | Documented as out-of-scope until distributor + Merlin scale |

---

## Path 1 — Indie artist upload

The Bandcamp / SoundCloud lineage. Artists create an account, upload a master, set a price floor. Every other path inherits the same audio pipeline.

- **Code:** [`apps/api/src/routes/uploads.ts`](apps/api/src/routes/uploads.ts), [`apps/web/src/app/upload/page.tsx`](apps/web/src/app/upload/page.tsx), [`apps/worker/src/jobs/transcode.ts`](apps/worker/src/jobs/transcode.ts)
- **Schema:** `users`, `artists`, `releases`, `tracks` in [`packages/db/src/schema.ts`](packages/db/src/schema.ts)
- **Ops:** none — works as soon as the stack is up.

## Path 2 — DDEX distributor ingest

Same standard Spotify uses. DistroKid, CD Baby, TuneCore, Amuse, RouteNote, Believe, Stem, Symphonic all deliver via DDEX ERN-4. Once Encore proves listener demand, distributors will deliver.

- **Spec:** [`docs/rfcs/002-ddex-ingest.md`](docs/rfcs/002-ddex-ingest.md)
- **Code:** [`apps/api/src/routes/ingest-ddex.ts`](apps/api/src/routes/ingest-ddex.ts), [`apps/worker/src/jobs/ddex-delivery.ts`](apps/worker/src/jobs/ddex-delivery.ts), [`packages/ingest-ddex/`](packages/ingest-ddex/) (parser + HMAC + DSR generator)
- **Sample manifest:** [`packages/ingest-ddex/fixtures/sample-ern4.xml`](packages/ingest-ddex/fixtures/sample-ern4.xml)
- **Ops next steps:**
  1. Set `ENABLE_DDEX_INGEST=true` in `.env.local`.
  2. Reach out to distributors at `partners@encore.audio`. Start with smaller indie-friendly distributors (Amuse, RouteNote) before pitching the big four.
  3. Issue Distributor IDs + HMAC shared secrets via the admin app.
  4. Generate monthly DSR usage reports automatically.

## Path 3 — Podcast RSS

Podcast publishing is RSS-based. There is no licensing layer to negotiate; the entire podcast ecosystem is open by construction. This is how Spotify added millions of podcasts overnight in 2019.

- **Code:** [`apps/api/src/routes/ingest-podcasts.ts`](apps/api/src/routes/ingest-podcasts.ts), [`apps/worker/src/jobs/podcast-poll.ts`](apps/worker/src/jobs/podcast-poll.ts), [`packages/ingest-podcast/`](packages/ingest-podcast/) (RSS + Podcasting 2.0 parser)
- **Schema:** `podcastFeeds`, `podcastEpisodes` in [`packages/db/src/schema.ts`](packages/db/src/schema.ts)
- **Ops next steps:**
  1. Seed initial directory from the Podcasting 2.0 Index (Creative Commons, public).
  2. Accept user submissions via `POST /ingest/podcasts`.
  3. Honor `podcast:locked` and `podcast:value` (V4V) tags.

## Path 4 — Creative Commons + Public Domain seed

Day-one catalog of millions of legally reusable tracks, from established curated archives. Listeners arrive to a real library, not an empty page.

- **Code:** [`packages/seed-catalog/`](packages/seed-catalog/) — three importers:
  - **Free Music Archive (~150k tracks, CC + PD):** [`packages/seed-catalog/src/fma.ts`](packages/seed-catalog/src/fma.ts)
  - **Internet Archive Live Music Archive (Grateful Dead etc., trader-friendly licenses):** [`packages/seed-catalog/src/etree.ts`](packages/seed-catalog/src/etree.ts)
  - **Jamendo CC catalog:** [`packages/seed-catalog/src/jamendo.ts`](packages/seed-catalog/src/jamendo.ts)
- **Bootstrap:** `pnpm seed:catalog` runs all three in sequence with progress reporting.
- **License preservation:** every imported track stores its original license URI in `releases.credits` and renders an attribution badge on the player.
- **Ops next steps:**
  1. Confirm storage budget — full FMA archive is ~700 GB. Sensible default is the editorial subset (~5 GB).
  2. Set `ENABLE_CC_SEED_IMPORT=true` in `.env.local`.
  3. Run `pnpm seed:catalog --source=fma --limit=1000` for an initial pull.

## Path 5 — Merlin

Merlin is the global digital rights agency for the independent music sector. Members include Beggars Group, Domino, Sub Pop, Secretly Group, ATO, Glassnote — about 20,000 indie labels representing roughly 15% of global recorded music revenue.

- **Spec:** [`docs/rfcs/002-ddex-ingest.md`](docs/rfcs/002-ddex-ingest.md) (same DDEX ERN-4 pipeline as Path 2)
- **Onboarding pathway:** Merlin requires a DSP to demonstrate scale (typical bar: ~1M MAU + clean DSR reporting + verified payouts) before extending membership. Encore's DSR generator is built to that standard.
- **Roadmap:** target Merlin application at v0.5 (post recommendations launch).

## Path 6 (intentionally not implemented) — Major labels

Direct deals with Universal Music Group, Sony Music, Warner Music Group cost hundreds of millions of dollars per year in mechanical and performance licensing, plus equity stakes in many cases. This is not a v1 deliverable. It is not a v3 deliverable for a solo OSS project.

The path forward — when and if Encore reaches the scale where this conversation is realistic:

1. Distributor + Merlin catalog already covers 30–40% of listener demand at scale.
2. A foundation-backed Encore (Phase 3 governance, [RFC 008](docs/rfcs/008-funding-governance.md)) approaches majors with documented MAU and DSR history.
3. Negotiation is per-territory and per-major. Realistically year 5+.

## Feature parity (the *technical* surface)

Catalog is the licensing question. Feature parity is the engineering question. Everything below is buildable as open source — no licensing bottleneck.

| Feature | Encore plan | Where it lives |
|---|---|---|
| Native mobile (iOS + Android) | Expo + react-native-track-player; CarPlay + Android Auto entitlements | [`apps/mobile/`](apps/mobile/), [RFC 007](docs/rfcs/007-apps.md) |
| Native desktop | Tauri 2 (mac + win + linux) | [`apps/desktop/`](apps/desktop/) |
| Lossless | FLAC pass-through + HiFi tier | [RFC 003](docs/rfcs/003-audio-quality.md) |
| Spatial audio (binaural) | libspatialaudio render via worker; ADM input | [RFC 003](docs/rfcs/003-audio-quality.md) |
| Recommendations | iALS CF + pgvector cosine + editorial | [`packages/recs/`](packages/recs/), [RFC 004](docs/rfcs/004-recommendations.md) |
| Editorial curation | In-house team + community curators; rotation; conflict-of-interest enforced | [`apps/admin/`](apps/admin/), [RFC 004](docs/rfcs/004-recommendations.md) |
| Offline downloads | Mobile cache via expo-file-system; desktop via Tauri FS | [RFC 007](docs/rfcs/007-apps.md) |
| Family / Student / HiFi plans | Subscription tier logic + entitlement gating | [`apps/api/src/lib/entitlements.ts`](apps/api/src/lib/entitlements.ts) |
| Privacy-first ads | Contextual targeting only (genre / mood / language) | [`apps/api/src/routes/ads.ts`](apps/api/src/routes/ads.ts) |
| Radio / stations | Genre + mood + artist radio; daily mixes | [`apps/api/src/routes/radio.ts`](apps/api/src/routes/radio.ts) |
| Federation | ActivityPub Person actor + outbox + inbox + HTTP signatures | [`apps/api/src/routes/federation.ts`](apps/api/src/routes/federation.ts), [RFC 005](docs/rfcs/005-federation.md) |

## The federation moat

ActivityPub federation is Encore's structural advantage. A major-label-backed competitor cannot build a federated music platform without losing the per-stream control its licensing terms require. We can.

- **What federates:** release metadata, follows, likes, reposts, comments.
- **What does not federate:** listener history, plays, recommendations data.
- **Inbound safety:** signature verification, instance blocklist, PhotoDNA hashing on attached art.
- **Operator opt-in:** `ENABLE_ACTIVITYPUB=false` by default; per-artist opt-in even when enabled.

Spec: [RFC 005](docs/rfcs/005-federation.md). Code: [`apps/api/src/routes/federation.ts`](apps/api/src/routes/federation.ts), [`apps/worker/src/jobs/outbox.ts`](apps/worker/src/jobs/outbox.ts), [`packages/activitypub/`](packages/activitypub/).
