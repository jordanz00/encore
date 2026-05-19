# Encore

> **Music, on artists' terms.** Open source. Federated. Zero platform tax.

**Encore is the artist-owned music platform:** sell your music directly, stream it everywhere, federate it to the fediverse, and keep every penny you earn — built open source, by artists, for artists.

Built because every existing alternative is structurally captured. Spotify pays $0.003/stream and 87% of tracks earn $0. Bandcamp got bought by Epic then dumped to Songtradr (50% staff cut, including the union committee). Audius lost $1.1M to a hack and the token is down 70%. Sound.xyz and Catalog both shut down in early 2026. Tidal cancelled user-centric payouts after major-label veto. Tracking the failure pattern in [`PLATFORM-SUCCESS-STRATEGY.md`](PLATFORM-SUCCESS-STRATEGY.md) led us to design Encore to be immune to each of those failure modes.

**License:** [GNU Affero General Public License v3.0 or later](LICENSE) (network copyleft).
**Status:** v0.0.1 — pre-launch scaffold targeting **public beta on day 7** of the ship sprint (see [`SHIP-PLAN-7-DAYS.md`](SHIP-PLAN-7-DAYS.md)).

## Read these first

| Document | What it answers |
|---|---|
| [`ARTIST-INCOME-GUARANTEE.md`](ARTIST-INCOME-GUARANTEE.md) | **The "no starving artists" design contract** — six revenue streams default-on, Discovery Dividend, Artist Wallet, Encore Day, Working Musician Stipend, anti-starvation invariants enforced in schema |
| [`BRAND-POSITIONING.md`](BRAND-POSITIONING.md) | The one-sentence pitch, the four pillars, the launch comms voice |
| [`COMPETITORS.md`](COMPETITORS.md) | Every player in the space, what they leak, where Encore wins |
| [`SHIP-PLAN-7-DAYS.md`](SHIP-PLAN-7-DAYS.md) | Day-by-day public-beta launch plan |
| [`ARTIST-ECONOMICS.md`](ARTIST-ECONOMICS.md) | What artists actually earn on each platform, with worked examples |
| [`ARTIST-PAIN-AUDIT.md`](ARTIST-PAIN-AUDIT.md) | 16 specific 2024–2026 artist grievances + Encore's schema-enforced fix for each |
| [`PLATFORM-SUCCESS-STRATEGY.md`](PLATFORM-SUCCESS-STRATEGY.md) | Why prior alternatives failed and how we are built differently |
| [`GLOBAL-LAUNCH-PLAYBOOK.md`](GLOBAL-LAUNCH-PLAYBOOK.md) | Payment rails, languages, regions, censorship resilience |
| [`CATALOG-PATHS.md`](CATALOG-PATHS.md) | The five legal paths to a real catalog |
| [`ROADMAP.md`](ROADMAP.md) | v0.1 → v1.0 milestones with realistic timelines |

## The four pillars

### Artist-First

Built around what artists actually earn. **0% platform fee** on direct sales, tipping, and merch. **User-centric subscription pool** — your fans' money flows to you, not a global pool that subsidizes megastars and stream farms. **No 1,000-stream cliff.** Songwriters get a per-track mechanical royalty dashboard. **Right-to-export** your catalog, fan list, and sales receipts at any time, forever.

### Open Source

AGPL-3.0. Built in the open. Un-acquirable. Every line of code is open source. The roadmap is public. Governance progresses to a non-profit foundation — no investor can buy us, gut the staff, and call it "synergies." If we ever break our promises to artists, the AGPL fork is the real Encore.

### Federated

ActivityPub-native. Artists on Encore can be followed from any Mastodon or Funkwhale instance. Communities, labels, festivals, and scenes can self-host their own instance — same software, full federation, no permission required. **Subsonic-API compatible**, so it works with the 50+ existing self-hosted-music mobile apps (DSub, play:Sub, Substreamer, Symfonium) day 1.

### Global

For artists everywhere, not just California. Pays artists in Nigeria, Kenya, India, Brazil, Indonesia, Argentina — through **Wise, M-Pesa, MTN MoMo, UPI, Pix, MercadoPago, Lightning**. Multi-currency wallet. 22 launch languages with community translations via Weblate. Regional reference instances in every populated continent. Tor onion services live for instances in censorship-fragile regions.

See [`docs/roles/`](docs/roles/) for the 30-role design brief and [`docs/rfcs/`](docs/rfcs/) for the eight architecture RFCs.

## Repo layout

```
apps/
  web/        Next.js 15 frontend (port 3000)
  api/        Fastify backend (port 3001)
  worker/     BullMQ + ffmpeg transcoder + ingest workers
  mobile/     Expo / React Native (iOS + Android + CarPlay/Android Auto stubs)
  desktop/    Tauri 2 (macOS + Windows + Linux)
  admin/      Editorial CMS (port 3002)
packages/
  db/             Drizzle schema + migrations (Postgres 16 + pgvector)
  audio/          ffmpeg + audio-analysis helpers
  player/         Cross-platform player core
  ui/             Shared design tokens
  sdk/            Public TS SDK (MIT-licensed; safe for 3rd-party clients)
  config/         Shared eslint / tsconfig / tailwind preset
  ingest-ddex/    Real DDEX ERN-4 parser + HMAC delivery verify + DSR generator
  ingest-podcast/ Real RSS + Podcasting 2.0 parser + OPML import
  activitypub/    Real ActivityPub primitives (actor, webfinger, HTTP Signatures, outbox)
  recs/           Hybrid recommendations (iALS CF + pgvector cosine + editorial + freshness)
  seed-catalog/   CC + Public Domain importers (FMA, Internet Archive, Jamendo)
infra/
  docker/     docker-compose.yml + per-app Dockerfiles
  helm/       Kubernetes Helm chart (placeholder)
  migrations/ SQL migration files
docs/
  roles/      30 role briefs (docs/roles/role-01.md ... role-30.md)
  rfcs/       8 architecture RFCs
  GOVERNANCE.md SECURITY.md ACCESSIBILITY.md ROADMAP.md FUNDING.md
```

## Prerequisites

- **Node.js** ≥ 20.10
- **pnpm** ≥ 9 (`brew install pnpm` or `npm install -g pnpm`)
- **Docker** + Docker Compose (`brew install --cask docker`)
- **ffmpeg** (`brew install ffmpeg`) — required by the worker
- **Rust** + Tauri prereqs only if you want to build the desktop app (`brew install rustup-init`; see [tauri.app](https://tauri.app/start/prerequisites/))

## Quick start (local dev)

```bash
# 1. Clone and install
git clone https://github.com/encore/encore
cd encore
cp .env.example .env.local
pnpm install

# 2. Start infrastructure (postgres, redis, minio, meilisearch, mailhog)
pnpm compose:up

# 3. Migrate the database and seed demo data
pnpm db:migrate
pnpm db:seed

# 4. Run the apps in dev (parallel)
pnpm dev
# web   → http://localhost:3000
# api   → http://localhost:3001
# admin → http://localhost:3002

# 5. (Optional) Seed a real CC + Public Domain catalog
ENABLE_CC_SEED_IMPORT=true pnpm seed:catalog
# Or single source: pnpm --filter @encore/seed-catalog seed -- --source=fma --limit=100

# 6. (Optional) Mobile dev
pnpm --filter @encore/mobile start

# 7. (Optional) Desktop dev
pnpm --filter @encore/desktop dev
```

## Verify

```bash
curl http://localhost:3001/health
# → {"ok":true,"service":"encore-api","version":"0.0.1",...}
```

Open <http://localhost:3000> for the listener UI, <http://localhost:8025> for caught dev email (Mailhog), <http://localhost:9001> for MinIO admin.

## Honest scope (read this)

Encore v0.0.1 ships a credible foundation, **not a finished Spotify peer**.

| Wired (real implementation) | Stubbed (interface + RFC) |
|---|---|
| Sign up / sign in (email + password) | Stripe payments + payouts |
| Artist profile, release page, track page | Privacy-first ad targeting |
| Track upload → presigned PUT → MinIO | CarPlay / Android Auto submission |
| **Real ffmpeg pipeline**: HLS ladder (320/256/128/64 kbps) + FLAC + EBU R128 + waveform | Native app store submissions |
| **Real DDEX ERN-4 ingest** + HMAC delivery verify + DSR usage reports | Production moderation team |
| **Real podcast RSS** (Podcasting 2.0: chapters, transcripts, value, locked) + OPML import | Spatial audio (binaural rendering — needs libspatialaudio) |
| **Real recommendations** (iALS CF + pgvector cosine + editorial + fresh-crate + sliders) | iALS offline training (CF shim uses online co-likes) |
| **Real radio / stations** (track / artist / genre / mood seeds) | Audio embeddings (job exists, model integration pending) |
| **Real ActivityPub federation** (webfinger, Person actor, outbox, HTTP Signatures, inbox verify) | |
| **Real CC seed importers** (Free Music Archive, Internet Archive Live Music Archive, Jamendo) | |
| **Real subscription tiers** (Free, Premium, Family, Student, HiFi entitlements + quality gating) | |
| Web player (HTMLAudio + MediaSession + keyboard) | |
| Browse `/discover`, `/search` (Meilisearch) | |
| Follow, plays counting (verified at 30s) | |
| Mobile shell (Expo) + Desktop shell (Tauri 2) | |

### Catalog strategy

| Path | Status |
|---|---|
| Indie upload | Wired |
| DDEX distributor ingest (DistroKid, CD Baby, TuneCore, Amuse, RouteNote) | Real parser + HMAC + DSR — needs distributor onboarding |
| Podcasts (RSS, no license required) | Real parser — `POST /ingest/podcasts` ready |
| CC + Public Domain seed (FMA, Internet Archive, Jamendo) | `pnpm seed:catalog` — day-one catalog |
| Merlin (Beggars, Domino, Sub Pop, Secretly) | Same DDEX pipeline — requires Merlin onboarding at scale |
| Major labels (UMG, Sony, WMG) | Out of scope until foundation + MAU + DSR history |

Full catalog walkthrough: [`CATALOG-PATHS.md`](CATALOG-PATHS.md).

## How Encore makes artists money — the Six-Stream Architecture

**No starving artists.** Every working musician on Encore gets paid for every verified play, every sale, every tip — weekly, in their own currency, with zero platform fee, *artist first*. The full design contract is in [`ARTIST-INCOME-GUARANTEE.md`](ARTIST-INCOME-GUARANTEE.md). The six revenue streams default-on per artist:

| # | Stream | Fee | Speed |
|---|---|---|---|
| 1 | **Direct sales** (single, album, name-your-price) | 0% (processor fee only) | Instant credit; weekly cash-out |
| 2 | **Tips** (one-off + monthly fan-to-artist) | 0% | Instant credit |
| 3 | **User-centric subscription pool** | 0% | Weekly |
| 4 | **Discovery Dividend** (every verified play earns from an ad + 10%-of-subs pool, no megastar weighting) | 0% | Weekly |
| 5 | **Sync licensing** (low blanket rates, opt-in) | 0% platform (15% to foundation legal-ops sub-pool) | 30-day clearance |
| 6 | **Live + merch passthrough** (Bandsintown + Printful) | 0% platform | Per partner |

**Schema-enforced anti-starvation invariants:**

- `sales.platform_fee_cents = 0` (DB CHECK constraint)
- `payouts.bundle_discount_applied = false` (forbids the Spotify mechanical-royalty cut that lost songwriters $150M)
- `discovery_dividend_period.per_play_rate_micro_cents > 0` when any verified plays exist (no 1,000-play gate, ever)
- `wallet_ledger.reason` from controlled vocabulary (no mystery deductions)
- `stipend_disbursements.funding_source = 'foundation_grants'` (Working Musician Stipend is grant-funded, never funded from other artists' pool)

Full economic model with worked examples + citations: [`ARTIST-ECONOMICS.md`](ARTIST-ECONOMICS.md). Strategy + how we avoid Resonate / Audius / Tidal-UCPS failure modes: [`PLATFORM-SUCCESS-STRATEGY.md`](PLATFORM-SUCCESS-STRATEGY.md).

## What artists actually hate about current platforms

The 16 active 2024–2026 grievances against Spotify, Bandcamp-under-Songtradr, SoundCloud, and Patreon — and the schema-enforced fix for each — are catalogued in [`ARTIST-PAIN-AUDIT.md`](ARTIST-PAIN-AUDIT.md). Highlights:

- Spotify's audiobook-bundle reclassification cut songwriter mechanical royalties by ~$150M in 12 months → Encore forbids any bundle discount on publishing-side payouts (schema invariant)
- "Perfect Fit Content" ghost artists on Spotify mood playlists → Encore forbids platform-owned ghost catalogs (foundation bylaw + monthly audit query)
- Discovery Mode "modern payola" class action → Encore ships no pay-to-prioritize ever
- Ek's $1B Helsing military AI investment triggered the largest indie exodus in Spotify's history → Encore cannot have founder-equity weapons exposure (no founder equity exists)
- Bandcamp post-Songtradr layoffs of 50% of staff including the entire union committee → Encore is AGPL-3.0 + foundation-owned, structurally un-acquirable

## Built for global artists, not just US/EU

68% of international creators cite payment processing as a major barrier; Stripe/Patreon/PayPal exclude most artists in Nigeria, Kenya, Argentina, Pakistan, Bangladesh, Indonesia. African artists face a 3–4× geographic penalty on Spotify per-stream payouts. [`GLOBAL-LAUNCH-PLAYBOOK.md`](GLOBAL-LAUNCH-PLAYBOOK.md) covers the regional payment rails (M-Pesa, MTN MoMo, UPI, Pix, MercadoPago, Lightning), language tiers (22 launch languages + community translations via Weblate), 7 reference instances by region, and censorship-resilience commitments (Tor onion services + federation bridge mode).

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Sign your commits with DCO (`git commit -s`). No CLA required.

## Governance + funding

See [`GOVERNANCE.md`](GOVERNANCE.md) and [`FUNDING.md`](FUNDING.md).

## Security

Report privately to `security@encore.audio`. See [`SECURITY.md`](SECURITY.md).

## Acknowledgements

Encore stands on top of decades of open-source work: ffmpeg, Postgres, Redis, MinIO, Next.js, React, Fastify, Drizzle, Meilisearch, Tauri, Expo, BullMQ, and many more. We owe the Funkwhale, Audius, Resonate, and Bandcamp teams in particular — their attempts taught us what to do and what to avoid.
