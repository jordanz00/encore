# Platform Success Strategy — How Encore Becomes Real (Not Another Resonate)

> Every prior open-source music platform has failed for *non-technical* reasons. This document is how we avoid each one.

## The honest historical pattern

| Project | Years | Why it stopped scaling / died | Direct lesson for Encore |
|---|---|---|---|
| **Resonate (co-op)** | 2015–2024 | No funding plan, no director insurance, board resignations en masse, profound lack of developer resources. "Couldn't out-engineer Spotify on volunteer time." | Funding **and** a legal entity must exist on day 1, not year 4. See §3. |
| **Audius** | 2018–present | Token-based economy attracted speculators, not music fans. $1.1M governance hack (2022) depleted the grants treasury. AUDIO token down ~70% in 2024–2025. | **No tokens. No crypto.** Bandcamp-style direct fiat or nothing. See §4. |
| **Tidal HiFi Plus / user-centric** | 2021–2023 | Major labels refused to license catalog under UCPS. Only 70,000 artists enrolled in Direct Artist Payouts → $500k total = $7/artist. Tidal cancelled the program in Feb 2023. | Build catalog from sources that **do not have label veto** — distributors via DDEX, CC/PD seed, podcasts, Merlin once we have scale. See [CATALOG-PATHS.md](CATALOG-PATHS.md). |
| **Funkwhale** | 2017–present | Survived (NLnet-funded), but small. Pure ActivityPub focus + no clear pathway from listener → artist revenue. v2.0 in alpha at the time of writing. | Federation is necessary but not sufficient. Pair it with **a clear artist revenue path** so artists have a reason to upload. See §5. |
| **Sonos Radio HD** | 2020–2024 | Radio-only (no on-demand) at premium pricing in a market where Apple Music gives lossless free. | Don't ship a worse Spotify and charge more. Ship something **structurally different**: artist-owned business hub. See §2. |

## §1. Three failure modes we must avoid

These are the failure modes the historical record points to. Each maps to an Encore guardrail.

1. **Volunteer-engineering-vs-funded-incumbent collapse** → Resonate killer. Mitigation: §3 (funded, not all-volunteer).
2. **Token-speculator-attractor flip** → Audius killer. Mitigation: §4 (no native token, ever).
3. **Empty-platform-no-artists collapse** → most OSS music platforms' silent death. Mitigation: §5 (day-one CC/PD catalog + dual-publish helpers) and §6 (founder distribution).

## §2. The "Why Encore" sentence

A single product sentence prospective artists and listeners can repeat.

> **Encore is the artist-owned music business hub: upload your album once, sell it directly, stream it everywhere, federate it to the fediverse, and keep the receipts. Self-hostable. No platform tax.**

If a feature does not serve that sentence, it goes in [`ROADMAP.md`](ROADMAP.md) under "Later." If a feature contradicts it, it does not ship.

## §3. Funding and entity — what Resonate did not have

Resonate's autopsy listed: no funding plan, no director insurance, no full-time devs. We address each before public launch.

### Funding sequencing

| Phase | Source | Realistic ceiling | Status |
|---|---|---|---|
| Phase 0 — scaffold + research | Personal time + recurring micro-grants | $0–$25k | Active (this scaffold) |
| Phase 1 — first runnable beta | **NLnet NGI0 Commons Fund** (open call to 1 June 2026; $5k–$50k tranches) | $50k–$150k cumulative | **File the proposal in May 2026** — the call has funded Funkwhale + ArtistHub on similar scope, so Encore fits the brief |
| Phase 2 — first 1k artists | NLnet + **Open Tech Fund** + **Mozilla MOSS** + **Sovereign Tech Fund** | $200k–$400k | Subsequent calls; one application per quarter |
| Phase 3 — first 100k listeners | Foundation + recurring donations (Open Collective) + revenue share on subscription tier launch | $500k–$1M | Earliest 2028 |
| Phase 4 — operating non-profit | Software Freedom Conservancy fiscal sponsorship or independent 501(c)(3) | Self-sustaining via subscription revenue | Earliest 2029 |

### Entity, governance, director protection

- **Fiscal sponsor first**, own entity later. Software Freedom Conservancy (USA), Open Source Collective, or Commons Conservancy (NL — same umbrella as NLnet) all sponsor projects for ~10% admin overhead and provide directors' liability cover. Resonate's collapse cited *missing director insurance* as a proximate cause.
- **BDFL → Maintainer Council → Foundation** governance progression as documented in [GOVERNANCE.md](GOVERNANCE.md) and [`docs/rfcs/008-funding-governance.md`](docs/rfcs/008-funding-governance.md).
- **No CLA**, DCO sign-off only ([CONTRIBUTING.md](CONTRIBUTING.md)) so we never end up with a single corporate fork inheritor.

## §4. Money model — what Audius did not get right

Audius optimized for *speculator* attraction, not *fan* attraction. The token went down, the grants ran out, the platform shrank. We do the opposite.

### Hard rules

1. **No native token. No "creator coin." No "social token." No Web3 cosmetics.** Encore rails are: card (Stripe Connect), bank transfer (SEPA / ACH), and Bitcoin Lightning (V4V) optional for podcasts. That is the entire list.
2. **All settlement in fiat.** Lightning tips are settled to fiat immediately by default (artist can opt to hold sats; that is the artist's choice, not platform default).
3. **Artist receives funds within 7 days of clearing.** Bandcamp pays within 24–48h to PayPal — that is the bar. Daily-batched payouts via Stripe Connect Express land in 2–7 days depending on country.
4. **Receipts are downloadable, complete, and tax-ready.** Every artist gets a one-click 1099-K (US), T4A (Canada), and EU VAT-on-cross-border summary annually.

## §5. Cold start — what Funkwhale ran into

A federated music platform with zero artists and zero listeners is unusable for both sides. Mastodon solved its cold start with the **"Packs"** feature (curated initial follow sets) and by serving underserved communities (LGBTQ+, marginalized groups) early. Encore adopts both moves.

### Day-one listener experience (must work on first visit, no sign-up)

- **150k+ tracks pre-seeded** from Free Music Archive, Internet Archive Live Music Archive, and Jamendo (see [CATALOG-PATHS.md](CATALOG-PATHS.md)). The library is never empty.
- **Editorial Packs** mirroring Mastodon Packs — "First 100 Encore Artists," "Bandcamp Friday Crossover," "Indie Hip-Hop 2026," etc. Curated by paid editors, rotated monthly.
- **Federated discovery from day 1.** When Encore federates with Funkwhale instances, the listener sees Funkwhale uploads in their search results.

### Day-one artist experience (must beat Bandcamp signup on every axis)

| Artist need | Bandcamp | Encore v0.1 commitment |
|---|---|---|
| Upload an album | Yes | Yes + automatic FLAC + waveform + EBU R128 normalization |
| Direct sales | 10–15% cut | **0% platform fee.** Processor fee only. |
| Fan list export | Manual | One-click CSV including emails, lifetime spend |
| Domain on artist.tld | Custom domain via Pro plan | Custom domain free at launch |
| Move catalog out | Bulk export available | One-click export ZIP includes audio, metadata, sales receipts, fan list. **Right of return enshrined in ToS.** |
| Federated presence | No | Mastodon-followable from day 1 |

### Dual-publish helpers (the migration ramp, not the ask)

We do not ask any artist to "leave Bandcamp." We ship one-click *dual-publish* helpers so an artist's existing Bandcamp release auto-mirrors to Encore (and vice versa) without re-uploading. The artist controls which surface is canonical. **The migration happens when the artist *wants* it to.**

- `apps/admin` ships a "Connect Bandcamp" button that scrapes the artist's own catalog (with their auth token) and creates parallel Encore releases set to mirror-mode.
- Same approach for SoundCloud (via SoundCloud's OAuth + the artist's own track API).
- Same approach for podcast RSS already shipped (`POST /ingest/podcasts/opml`).

## §6. Distribution — how the first 1,000 artists actually arrive

Funkwhale's lesson: build it and they will *not* come. You have to go to them. The Encore distribution playbook follows what worked for Bandcamp (vertical communities) and Mastodon (community-led migration).

### Three lanes, run in parallel from day 1

1. **Scene-by-scene seeding.** Identify ~30 indie scenes (DIY hardcore, footwork, ambient, lo-fi indie, beats, jazz fusion, classical contemporary, etc.) and personally onboard 5 cornerstone artists per scene. Bandcamp grew this way — Amanda Palmer, Sufjan Stevens, RJD2 in the early days are documented founding adopters.
2. **Label and distributor partnerships.** Pitch indie distributors (Amuse, RouteNote, AWAL alternative tier) on adding Encore as a *free additional DSP* — they already deliver DDEX to 50+ DSPs, one more is engineering-cheap for them and a strict win for their artists.
3. **Foundation and educational tie-ins.** Most music schools and conservatories already hate Spotify pedagogically (Berklee Online has published anti-Spotify curriculum). Offer free institutional instances for music schools and student-run radio stations.

### Anti-pattern: do not chase virality

A viral moment without infrastructure to absorb the artists is worse than no moment. Mastodon's 2022 spike (300k → 2.5M in two months) created sustained moderation crises. Encore targets **steady, sustainable artist growth** — 10x per year is plenty.

## §7. Trust and safety — the silent platform killer

A platform that ships moderation as an afterthought becomes a CSAM and copyright-strike disaster within 6 months and either dies or becomes a censorship surveillance machine. We get this right on day 1.

- **PhotoDNA on every uploaded image** (free for non-profits via NCMEC). See [`SECURITY.md`](SECURITY.md).
- **DMCA workflow** with notice + counter-notice + transparency report, modeled on Bandcamp's actual published workflow.
- **Federation blocklist + per-instance moderation tools** modeled on Mastodon's instance-level moderation patterns.
- **Privacy-respecting fake-play detection** (signal-fingerprint, no behavioral profiling) to protect the subscription pool from bot fraud — see [`docs/rfcs/004-recommendations.md`](docs/rfcs/004-recommendations.md).
- **No surveillance ads, ever.** Hard schema constraint, documented in [`ARTIST-ECONOMICS.md`](ARTIST-ECONOMICS.md) §"What this means for product."

## §8. Three scenarios — what success looks like

We refuse to define success by Spotify benchmarks. Here are the three real measures.

### Scenario A — Niche but sustainable (2028 target)

- 50,000 artists
- 500,000 listeners
- 30% subscribed, paying $7/mo average
- ~$13.2M / year in subscription revenue
- 70% → artist pool (UCPS) = $9.2M / year to artists
- Operating cost ~$2M / year (3 full-time eng, 2 ops, 1 trust & safety, 1 community)
- **Solvent, indie-aligned, federated. This is "Bandcamp + streaming, OSS." It is a complete success.**

### Scenario B — Federated leader (2030 target)

- 250,000 artists
- 5M listeners
- Merlin onboarding complete; ~20% of Merlin label catalog also on Encore
- ActivityPub bridges 5M+ Funkwhale + Mastodon users into discovery
- ~$70M / year subscription + ~$10M / year direct sales
- **The OSS music platform with the largest non-major catalog. Genuinely competitive with non-major SPotify usage.**

### Scenario C — Industry pivot (2033+ target, contingent on A + B)

- Foundation entity, non-profit, multi-stakeholder board (artists + listeners + operators).
- First-line approach to major labels for direct deal once we control 10%+ of indie streaming share.
- Distribution arm spun off so Encore can deliver out to Spotify / Apple on artists' behalf at 0% commission (recovering distributor revenue for artists).
- **The structural alternative to the Big Three streaming oligopoly. Not Spotify-sized, but consequential.**

## §9. Anti-success scenarios — what we refuse to become

To make the strategy enforceable, document what we will not do even under growth pressure.

1. **We will not introduce a token.** If the project pivots to a token, the AGPL fork will be the real Encore.
2. **We will not introduce behavioral ad targeting** even if the subscription pool runs short.
3. **We will not sell listener data** for any price.
4. **We will not give majors veto over artist payouts** — UCPS is non-negotiable for the subscription pool.
5. **We will not bury small-scale artists** behind a streaming threshold. No 1,000-stream cliff.
6. **We will not vendor-lock catalogs.** Bulk export is a permanent ToS right.

## §10. What to do in the next 30 days

These are the artifacts that turn this document into a funded project, in order:

1. **Apply to NLnet NGI0 Commons Fund** before the 1 June 2026 deadline. The proposal writes itself from this repository: scope = federation + DDEX ingest + UCPS payouts; budget = $50–75k for 12 months focused engineering.
2. **Choose a fiscal sponsor.** Commons Conservancy (NL, aligned with NLnet) or Open Source Collective (US). 30-minute call each; pick by end of month.
3. **Register the .org and .net domains** (`encore.audio`, `encore.audio`) and put up a single-page coming-soon site that links to this README and the funding call.
4. **Onboard the first 10 cornerstone artists by hand.** Bandcamp did this with Amanda Palmer / Sufjan Stevens / RJD2. Identify 10 willing-to-experiment indie artists in your direct network or one degree out; offer them a permanent founder badge and 0% fee for life in exchange for stress-testing the platform.
5. **Publish the [ARTIST-ECONOMICS.md](ARTIST-ECONOMICS.md) one-pager** as a public blog post; it is the marketing pitch and the artist-recruiting pitch in one.

## Citations

- Resonate dissolution: official Resonate site, "Restructuring" + "Past, present and future" posts; HN thread #37794806 (board resignations, missing director insurance, dev shortage).
- Audius governance hack: *The Block* (Jul 2022); Audius Blog "Governance Takeover Post-Mortem 7/23/22"; Audius grants reboot post; AUDIO token price decline (CryptoNews/TheNewsCrypto, May 2025).
- Tidal Direct Artist Payouts cancellation: *TechCrunch* (Feb 28 2023) — 70k artists, $500k total payouts; *Billboard* on Tidal user-centric blocked by labels.
- Funkwhale status: official NLnet funding page; Funkwhale 2.0 alpha blog post (May 2025).
- Sonos Radio HD positioning: *TechHive* coverage of $7.99 launch.
- Mastodon "Packs" feature: Mastodon adoption coverage (2025); Mastodon labour pains (Internet Policy Review).
- Bandcamp early adopter strategy: Bandcamp blog (2008, 2010); *LA Times* (Jan 2011); Waxy.org launch coverage; Bloomberg 2011 piece.
- NLnet open calls: NLnet NGI0 Commons Fund page; October 2025 funding announcement.
- Streaming economics: Lackluster (Medium, Jan 2026); Los Campesinos! (NME, 2025); Chartlex 2026 series.
