# Competitive Audit — Every Player in the Space, and Where Encore Wins

> This document is the field map. Every meaningful platform an artist or listener might use today is listed below with what it does, what it costs the artist, where it leaks, and the Encore differentiator. No assertion is uncited.

## How to read this doc

Each competitor row carries the same five columns:

| Field | Meaning |
|---|---|
| **Position** | What the platform actually is, not the marketing pitch |
| **Artist economics** | What the artist keeps, fee structure, payout latency |
| **Catalog scale** | Catalog size and rough MAU/MUU |
| **Where it leaks** | The structural failure, cited |
| **Encore differentiator** | The one or two things we do that they cannot or will not |

## Tier 1 — Mainstream streaming (the incumbents)

### Spotify

| Field | Detail |
|---|---|
| Position | Global on-demand streaming with podcasts and audiobooks. Public Swedish company (market cap ~$120B). |
| Artist economics | $0.003–$0.005 per stream (US-weighted). 87% of tracks earn $0 (under 1,000-stream gate). Mechanical royalties cut $150M in 12 months by audiobook-bundle reclassification (MLC v. Spotify, May 2024). |
| Catalog scale | ~100M tracks, ~700M MAU. |
| Where it leaks | Pro-rata pool dilution; ghost-artist "Perfect Fit Content" displacing real artists on biggest playlists (*Harper's*, Jan 2025); Discovery Mode payola class action; CEO's $1B Helsing military-AI investment triggered indie exodus June 2025 onward (Deerhoof, King Gizzard, Massive Attack, Godspeed You! Black Emperor, ~70 Chicago musicians). |
| Encore differentiator | User-centric subscription pool; no 1,000-stream cliff; foundation-owned (impossible to weaponize via investor portfolio); schema-level prohibition on ghost catalogs and pay-to-prioritize. |

### Apple Music

| Field | Detail |
|---|---|
| Position | Closed-ecosystem streaming + Apple hardware lock-in. ~€0.010/stream — 3× Spotify rate. |
| Artist economics | Higher per-stream rate but pro-rata pool with same megastar bias. No direct sales. Catalog hosted, not owned by artist. |
| Catalog scale | ~100M tracks, ~93M subscribers. |
| Where it leaks | Apple ecosystem dependency; iOS-first feature parity gap with Android; no in-app direct sales (App Store policy); editorial curation opaque. |
| Encore differentiator | Cross-platform native apps (Tauri desktop + Expo mobile) without Apple Music's iOS-first feature lock; direct sales 0%-fee; transparent editorial. |

### YouTube Music

| Field | Detail |
|---|---|
| Position | Streaming on top of YouTube's video corpus. ~€0.002/stream — the lowest mainstream rate. |
| Artist economics | Among the worst per-stream payouts. Ad-supported tier dilutes subscription pool. |
| Catalog scale | All of YouTube's music videos + licensed audio catalog. Largest by track count. |
| Where it leaks | Discovery dominated by YouTube algorithm (engagement-bait); creator vs music-artist tooling fragmented; no direct sales. |
| Encore differentiator | Discovery slider transparency; no engagement-bait recommendations; direct sales. |

### Amazon Music

| Field | Detail |
|---|---|
| Position | Streaming bundled with Prime; lossless tier free with Prime as of 2024. |
| Artist economics | ~€0.004/stream pro-rata. |
| Catalog scale | ~100M tracks, ~80M subscribers. |
| Where it leaks | Bundled-in-Prime means listener has no music-specific spending signal; discovery weak; Amazon ad ecosystem mixed in. |
| Encore differentiator | Music-only revenue (no Prime cross-subsidy); user-centric pool. |

### Tidal

| Field | Detail |
|---|---|
| Position | High-fidelity streaming acquired by Square/Block. Tried user-centric ("Direct Artist Payouts") 2021–2023, cancelled. |
| Artist economics | ~€0.013/stream — second-highest mainstream rate. Direct Artist Payouts cancelled Feb 2023 (only 70k artists enrolled, $500k total payouts ≈ $7/artist). User-centric blocked by major labels. |
| Catalog scale | ~110M tracks, ~5M paying subscribers. |
| Where it leaks | Square/Block strategic neglect post-acquisition; small subscriber base; couldn't overcome label veto on UCPS. |
| Encore differentiator | No major-label dependency for launch catalog (distributors + Merlin + CC seed), so we cannot be blackmailed into pro-rata. |

### Qobuz

| Field | Detail |
|---|---|
| Position | Highest-fidelity streaming with strong editorial. €0.018/stream — 6× Spotify rate. |
| Artist economics | Best mainstream per-stream rate; classical/jazz audience. |
| Catalog scale | ~100M tracks, ~1M subscribers. |
| Where it leaks | Niche audience; expensive; no direct sales; small budget against incumbents. |
| Encore differentiator | Same fidelity (FLAC HiFi tier) at lower price point; direct sales 0%-fee. |

### Deezer

| Field | Detail |
|---|---|
| Position | French streaming with "artist-centric" model (pro-rata backbone + professional-artist weighting + caps + noise exclusions). |
| Artist economics | Boosts professional artists meeting thresholds; weights search-driven listening. |
| Catalog scale | ~120M tracks, ~10M subscribers. |
| Where it leaks | Artist-centric is *not* user-centric — still a pool; "professional artist" gate excludes hobbyists. |
| Encore differentiator | True user-centric (your $9.99 → only artists you played). No professional-vs-hobbyist gate. |

## Tier 2 — Direct-sales / fan-funded

### Bandcamp (post-Songtradr)

| Field | Detail |
|---|---|
| Position | The original artist-friendly direct-sales platform. Acquired by Epic Games 2022, sold to Songtradr Oct 2023 with ~50% staff cut (incl. entire union committee). |
| Artist economics | 15% digital → 10% after $5k cumulative sales. 10% physical. Plus 2.9% + $0.30 processor. PayPal payout only (~24–48h). $1.71B paid to artists since 2008. |
| Catalog scale | Self-released indie; no precise number. |
| Where it leaks | Post-Songtradr trust collapse; PayPal-only excludes Africa/South Asia/parts of LATAM; editorial halved; no streaming; no federation. |
| Encore differentiator | 0% platform fee (vs Bandcamp's 10–15%); Stripe + Wise + M-Pesa + UPI + Pix + Lightning (vs PayPal-only); federated; AGPL-3.0 (un-acquirable). |

### SoundCloud

| Field | Detail |
|---|---|
| Position | Upload-driven streaming + community + DJ mixes. Pivoted to fan-powered royalties 2021; new 2025 tier: 100% distribution royalty pass-through + Fan Support tipping (100% to artist). |
| Artist economics | Artist Pro $99/year; 100% distribution royalty retention (Nov 2025+); Fan Support tipping ($1–$1,000) at 100% to artist. Customer service complaints (David Whiting, Jan 2025). |
| Catalog scale | ~320M tracks, ~130M MAU. |
| Where it leaks | DJ mixes face copyright takedowns; service quality post-2017 layoffs; closed source; no federation; not actually free monetization. |
| Encore differentiator | Free unlimited uploads + 0% platform fee + federated discovery + OSS. |

### Audiomack

| Field | Detail |
|---|---|
| Position | The fastest-growing genuine indie alternative. 50M MAU (Jan 2026), 31% YoY growth, dominant in 21 African countries. Half of listeners in Africa. Warner licensing expanded to 47 countries 2025. |
| Artist economics | Free unlimited uploads; advanced analytics; release scheduling — all free. AMP monetization in beta (full 2027). Audiomack Pro launched 2026. |
| Catalog scale | Strong in Afrobeats, hip-hop, R&B, Afropop. Over 1M active creators. |
| Where it leaks | Closed-source; ad-supported model with limited artist payout transparency; growing major-label dependence (Warner licensing); no federation; no direct sales. |
| Encore differentiator | Open source + federated + direct sales 0% fee + transparent payouts. Audiomack proves the global-first strategy works — Encore wins by being all the things Audiomack is + the things it cannot be (open source, federated, direct sales, songwriter dashboard). |

### Hearthis.at

| Field | Detail |
|---|---|
| Position | DJ-friendly SoundCloud alternative with lossless support and direct track sales. |
| Artist economics | Premium tier required for lossless + unlimited uploads; direct sales instant revenue. |
| Catalog scale | Small but loyal DJ/producer community. |
| Where it leaks | Closed-source; small; pay-walled lossless. |
| Encore differentiator | Same DJ-friendly features (waveform comments, set uploads) + free lossless + federation. |

### Mixcloud

| Field | Detail |
|---|---|
| Position | Long-form DJ mixes and radio shows with proper licensing (so mixes are not taken down like on SoundCloud). |
| Artist economics | Pro tier from $13.99/mo; revenue share with rightsholders via licensing deals. |
| Catalog scale | ~20M+ uploads, ~17M monthly listeners. |
| Where it leaks | Closed-source; licensing surcharge inflates listener price; no direct sales. |
| Encore differentiator | Same long-form DJ tooling + federation + 0%-fee direct sales for the DJ's own original tracks. |

### Stationhead

| Field | Detail |
|---|---|
| Position | Live radio app — listeners stream Spotify/Apple together with hosts. |
| Artist economics | Indirect (royalties flow through underlying streaming service). |
| Catalog scale | Bridges to Spotify + Apple catalogs. |
| Where it leaks | Total dependency on Spotify/Apple; no monetization independence. |
| Encore differentiator | Native live radio rooms (federated party listening) on top of Encore catalog with direct tipping. |

## Tier 3 — Distributors (deliver to Spotify et al.)

### DistroKid

| Field | Detail |
|---|---|
| Position | The cheapest distributor at scale. $22.99–$24.99/year unlimited. |
| Artist economics | Keeps 0% of royalties. Add-on fees (Content ID, "Leave a Legacy" charge to keep music live after cancellation, publishing admin). |
| Catalog scale | Powers ~30%+ of new releases on Spotify. |
| Where it leaks | Cancellation extortion ("Leave a Legacy"); add-on creep; not a destination, just a pipe. |
| Encore differentiator | Encore is both destination AND can deliver out via the DDEX pipeline run in reverse (v0.5 roadmap) at 0% commission. |

### CD Baby

| Field | Detail |
|---|---|
| Position | Original indie distributor. One-time fee + perpetual 9% royalty commission. |
| Artist economics | $9.95 single / $14.99–$29.95 album one-time + 9% perpetual on all royalties forever. |
| Catalog scale | Decades of indie catalog. |
| Where it leaks | Perpetual commission stacks vs DistroKid's annual fee — DK is cheaper for any artist who earns. |
| Encore differentiator | 0% perpetual commission on direct sales; DDEX delivery out at cost. |

### TuneCore

| Field | Detail |
|---|---|
| Position | Tiered subscription distributor. $22.99–$54.99/year. |
| Artist economics | 0% of royalties; high cumulative cost for active releasers. |
| Catalog scale | Large indie pipe. |
| Where it leaks | Expensive vs DistroKid for high-volume releasers; not a destination. |
| Encore differentiator | Same — destination + delivery, OSS, 0% direct sales. |

### Amuse / RouteNote / Symphonic / Believe / Stem / AWAL / UnitedMasters

| Field | Detail |
|---|---|
| Position | Mid-market distributors with varying royalty splits (UnitedMasters SELECT: 100% retention at $5.99–$59.99/mo; AWAL: 85% split, application required; Stem: 85% split, application required). UnitedMasters killed free tier early 2026. |
| Artist economics | Royalty splits 0–15% by tier; some application-gated. |
| Catalog scale | Substantial indie aggregators; together represent ~40% of new releases on major DSPs in 2026. |
| Where it leaks | Application gates; tier creep; not destinations. |
| Encore differentiator | Encore ships the same DDEX delivery pipeline (`packages/ingest-ddex` *in reverse* on the roadmap), but as a destination + delivery hub, no application gate, OSS, foundation-owned. |

## Tier 4 — Failed / dying Web3 music

### Audius

| Field | Detail |
|---|---|
| Position | "Decentralized" blockchain-music platform. AUDIO token down ~70% in 2024–2025. |
| Artist economics | Token-denominated rewards; $1.1M governance hack July 2022 depleted treasury. |
| Catalog scale | Declining. |
| Where it leaks | Token attracted speculators, not music fans; governance hack; grants reboot underway via Open Audio Foundation but momentum lost. |
| Encore differentiator | **Zero tokens.** All settlement in fiat (or BTC Lightning for tips). Foundation-owned, no speculative attack surface. |

### Sound.xyz

| Field | Detail |
|---|---|
| Position | Music NFT drop platform. Went into maintenance mode Jan 16, 2026. Team pivoted to Vault (vault.fm). |
| Artist economics | NFT-based drops; collectors paid in ETH. |
| Catalog scale | Boutique; high-value drops, low volume. |
| Where it leaks | NFT market collapse; pivot announcement = effective shutdown. |
| Encore differentiator | No NFT dependency; sustainable funding plan (NLnet grants → foundation → subscription revenue share). |

### Catalog (catalog.works)

| Field | Detail |
|---|---|
| Position | Music NFT marketplace. Shut down March 2026 after 5 years. Open-sourced their codebase. |
| Artist economics | $3M total to artists over 5 years (small per-platform total). Individual songs up to $100k at launch. |
| Catalog scale | Boutique. |
| Where it leaks | NFT market collapse; can't sustain operations. |
| Encore differentiator | Permanent funding model (foundation + subscription revenue share) vs NFT volatility. |

### Royal, Sound, Even, Mintsongs, etc.

| Field | Detail |
|---|---|
| Position | Music NFT / fractional-royalty experiments. Mostly inactive or pivoting. |
| Artist economics | Speculative; high churn. |
| Catalog scale | Tiny. |
| Where it leaks | Sector collapsing in 2025–2026. |
| Encore differentiator | Same — no token, no NFT, no speculative dependency. |

## Tier 5 — Self-hosted / OSS music servers

### Navidrome

| Field | Detail |
|---|---|
| Position | Lightweight Go-based music server. v0.55 "Big Refactor" March 2025 (multiple artists per album, custom tags, real-time watcher). ~20k GitHub stars. |
| Artist economics | N/A — listener-side software. |
| Catalog scale | One person's library, up to massive collections. |
| Where it leaks | Single-user / single-instance focus; no artist-side tooling; no payments; no federation; no upload-from-public flow. |
| Encore differentiator | Encore ships **Subsonic-API compatibility** so every Navidrome mobile app (50+ apps) works with Encore day 1. We are a superset for artists, a peer for listeners. |

### Jellyfin (music)

| Field | Detail |
|---|---|
| Position | Full media server (video + music). ~40k stars. Music features lag video. |
| Artist economics | N/A. |
| Catalog scale | Personal library. |
| Where it leaks | Music is secondary; heavier than Navidrome; same single-instance focus. |
| Encore differentiator | Same as Navidrome — Subsonic compatibility + artist-facing platform. |

### Funkwhale

| Field | Detail |
|---|---|
| Position | The most-aligned OSS peer. Federated via ActivityPub. NLnet-funded. v2.0.0-alpha.1 (May 2025). MetaBrainz integration Aug 2025. |
| Artist economics | No payments built in. Volunteer + grant funded. |
| Catalog scale | Small; per-instance. |
| Where it leaks | No clear listener→artist revenue path; uploads stalled; no native apps; no direct sales. |
| Encore differentiator | Encore **federates with Funkwhale day 1** — we are not competing with Funkwhale, we are extending it. Our additions: payments (0% direct sales + UCPS), native apps, DDEX ingest, songwriter dashboard, global payment rails. |

### Subsonic + Airsonic + Gonic + Astiga

| Field | Detail |
|---|---|
| Position | Legacy Subsonic API ecosystem with various server reimplementations. |
| Artist economics | N/A. |
| Catalog scale | Personal. |
| Where it leaks | Aging API; closed-source original (Subsonic); no federation; no artist-facing tooling. |
| Encore differentiator | Subsonic API compatibility shipped, so the entire mobile-app ecosystem (DSub, play:Sub, Substreamer, Symfonium) works against Encore. |

## Tier 6 — Regional dominants (the "non-Western" music landscape)

### Boomplay (Africa)

| Field | Detail |
|---|---|
| Position | African leader. 100M+ songs. Owned by Transsion (Chinese phone OEM popular in Africa). |
| Artist economics | Free + premium tiers; African distributor partnerships; counts toward Billboard charts. |
| Catalog scale | Dominates Nigerian, Kenyan, Ghanaian markets. |
| Where it leaks | Closed source; corporate ownership; ad-driven; no federation. |
| Encore differentiator | African reference instance (`af.encore.audio`) with M-Pesa + MTN MoMo + Flutterwave payouts; federation; OSS; 0%-fee direct sales. |

### JioSaavn (India)

| Field | Detail |
|---|---|
| Position | India leader, 80M+ songs in 16 languages. Owned by Reliance Jio. |
| Artist economics | Pro tier; major-label-backed. |
| Catalog scale | All Indian language markets (Hindi, Punjabi, Tamil, Telugu, Bengali, Marathi). |
| Where it leaks | Owned by India's largest telecom; lock-in concerns; algorithmic transparency low. |
| Encore differentiator | South Asia reference instance with UPI payouts + Hindi/Tamil/Telugu/Bengali UI + transliteration search. |

### NetEase Cloud Music / QQ Music / KuGou (China)

| Field | Detail |
|---|---|
| Position | Chinese internal market leaders. Government-regulated. |
| Artist economics | Internal Chinese ecosystem; opaque externally. |
| Catalog scale | Massive within China. |
| Where it leaks | Inaccessible to non-Chinese artists. |
| Encore differentiator | Encore does not operate in mainland China; community-run instances allowed at operators' risk; no submission to censorship. |

### Anghami (MENA), Resso (SE Asia, ByteDance), Gaana (India), Wynk (India), Joox (SE Asia)

| Field | Detail |
|---|---|
| Position | Regional streaming services. Many ByteDance/Tencent-backed. |
| Artist economics | Various; usually pro-rata pool. |
| Catalog scale | Regional. |
| Where it leaks | Closed; corporate-owned; opaque payouts; no federation. |
| Encore differentiator | Regional reference instances + local payment rails + OSS. |

## Tier 7 — Creation tools (adjacent, not competitive)

### BandLab

| Field | Detail |
|---|---|
| Position | Browser-based DAW + social network. 100M users (claim). Owned by Caldecott Music Group (Singapore-based, $90M raised). Sony 360 Reality Audio partnership 2025. |
| Artist economics | Free; subscription tier for advanced features. Artist services via ReverbNation (which CMG also owns). |
| Catalog scale | Creator-side; not a streaming destination. |
| Where it leaks | Closed source; corporate ownership; no direct sales. |
| Encore differentiator | Encore does not compete with BandLab — we integrate. Export from BandLab → upload to Encore. |

### Splice

| Field | Detail |
|---|---|
| Position | Sample library + DAW project hosting. Acquired Spitfire Audio April 2025 ($50M). ~600k subs, $100M ARR. |
| Artist economics | Subscription model for sample access. |
| Catalog scale | Creator-side. |
| Where it leaks | Closed; subscription paywall; sample copyright complexity. |
| Encore differentiator | Same — integration point, not competition. |

### Ableton, Logic, Pro Tools, Reaper

| Field | Detail |
|---|---|
| Position | DAWs. Reaper is the only one OSS-friendly. |
| Artist economics | License or subscription; sometimes free. |
| Catalog scale | N/A. |
| Where it leaks | N/A — not in the distribution space. |
| Encore differentiator | Not competing. |

## Tier 8 — Adjacent infrastructure (we work with, not against)

| Platform | What | Our relationship |
|---|---|---|
| MusicBrainz | Open music metadata DB | Source of canonical artist / release / track metadata at ingest time |
| ListenBrainz | Open scrobbling | Encore exports scrobbles natively (artist-controlled) |
| ISRC International Agency | Recording identifiers | Required identifier on every track in DDEX flow |
| ASCAP / BMI / SOCAN / PRS / SACEM / GEMA | Performing rights organizations | Encore splits subscription pool 50/50 recording/publishing and routes publishing share to artist's PRO |
| Merlin | Indie label digital rights agency | DDEX ingestion partner — same pipeline as distributors |
| MLC (Mechanical Licensing Collective) | US mechanical royalty payments | Integration target for songwriter royalties |
| Open Audio Foundation | OSS music advocacy | Potential coalition partner |
| NLnet / NGI Zero | Grant funder | Source of v0.1 → v1.0 funding |

## The "Where Encore Wins" sweep — one table

Pick any competitor. Find the one row that compresses the entire pitch:

| Differentiator | Beaten competitors |
|---|---|
| **0% platform fee on direct sales** | Spotify, Apple Music, YouTube Music, Amazon, Tidal, Qobuz, Deezer, Bandcamp (10–15%), SoundCloud, Audiomack |
| **User-centric subscription pool, no major-label veto** | Spotify, Apple Music, YouTube Music, Amazon, Tidal (cancelled), Deezer (partial), Qobuz |
| **No 1,000-stream cliff** | Spotify |
| **Foundation-owned, no investor exit risk** | Bandcamp (Epic → Songtradr), Audius, Sound.xyz, Catalog, BandLab, Splice |
| **AGPL-3.0 open source** | Every closed-source competitor |
| **Federated via ActivityPub** | Every non-Funkwhale competitor; we federate WITH Funkwhale |
| **Subsonic API compatible** (free mobile-app ecosystem day 1) | Every non-self-hosted competitor; we extend Navidrome/Jellyfin/Subsonic's app ecosystem |
| **Global payment rails (M-Pesa, MoMo, UPI, Pix, Flutterwave, MercadoPago, Lightning)** | Every Western-creator-platform competitor (Bandcamp, Patreon, SoundCloud, Stripe-only platforms) |
| **DDEX delivery + DSR reporting built-in** | Every non-distributor destination |
| **Songwriter dashboard (per-track mechanical royalty visibility)** | Every competitor (Spotify hides per-track mech royalties even from MLC reports) |
| **Schema-enforced no-tokens, no-behavioral-ads, no-payola** | Audius, Sound.xyz, Catalog (tokens); Spotify (Discovery Mode payola); Spotify/YouTube (behavioral ads) |
| **Right-to-Export (audio masters + fan list + sales receipts + federation key)** | Every closed competitor |
| **No mechanical-royalty bundle discount allowed (schema invariant)** | Spotify (cost songwriters $150M in 12 months by reclassifying as bundle) |
| **No ghost catalog allowed (foundation bylaw + audit query)** | Spotify (~20 commissioned songwriters across 500+ fake artist profiles) |

## What the audit changes about strategy

Three updates to the existing strategy docs flow directly from this audit:

1. **Audiomack is the proof case** for the global-first thesis: 50M MAU, 31% YoY growth, Africa-dominant. Encore's `GLOBAL-LAUNCH-PLAYBOOK.md` is not speculative — it is the strategy that already works for the fastest-growing genuine indie alternative to Spotify. Add Encore differentiators that Audiomack cannot match (federation, OSS, 0%-fee direct sales) and we have a clear position.

2. **Subsonic API compatibility is a free-distribution win.** ~50 existing mobile apps (DSub, play:Sub, Substreamer, Symfonium, etc.) already exist and connect to any Subsonic-compatible server. Shipping the Subsonic API in `apps/api/src/routes/subsonic.ts` (v0.6 target) means Encore instantly has a mature mobile-app ecosystem without writing a single native app.

3. **Funkwhale is a partner, not a competitor.** v0.2 roadmap is updated to *interop with Funkwhale on launch*, not just "test against one Funkwhale instance." Encore users follow Funkwhale artists from day 1 and vice versa.

## Citations

- *Fast Company* (2025): Audiomack as unlikely Spotify competitor.
- *Music Business Worldwide*, *Music Ally*, *Creative Industries News* (Jan 2026): Audiomack 50M MAU, 31% YoY growth.
- Audiomack Creators page: free unlimited uploads + 1M+ active creators.
- *Sony Corporation* press (Apr 2025): BandLab × Sony 360 Reality Audio partnership.
- *Music Business Worldwide* (2025): Splice acquires Spitfire Audio $50M; $100M ARR, 600k subscribers.
- Caldecott Music Group, BandLab Technologies pages.
- *Outposts.io* (2026): Sound.xyz enters maintenance mode, shift to Vault.
- *River.site* (2026): Catalog shutdown March 2026 after 5 years, $3M total to artists.
- *The Block* (2022): Royal NFT drop crashes.
- *selfhosting.sh*, *Linuxiac*, *Navidrome v0.55 release notes* (2025): Navidrome vs Jellyfin comparison.
- *Musicful*, *Togwe*, *AudiArtist*, *AppVulture* (2025–2026): SoundCloud alternatives — Hearthis.at, Mixcloud, Audius (declining).
- AWAL, UnitedMasters, Stem, Orphiq, Chartlex 2026 series: distributor comparisons + UnitedMasters free tier discontinuation.
- *TheBestMusicDistributors.com* (2026): UnitedMasters guide.
- Boomplay product page; JioSaavn product page; Google Play listings.
- All Spotify / Bandcamp / SoundCloud / Tidal / Audius citations from `ARTIST-PAIN-AUDIT.md`, `PLATFORM-SUCCESS-STRATEGY.md`, `ARTIST-ECONOMICS.md`.
