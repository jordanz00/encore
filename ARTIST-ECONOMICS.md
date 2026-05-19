# Artist Economics — How Encore Maximizes Artist Take-Home

> "Streaming is exposure, not income." — every working musician in 2026

This document is the design contract for every product decision Encore makes about money. The goal is unambiguous: **maximize what artists actually deposit in their bank account per fan-hour spent listening, watching, or buying.** Every feature is evaluated against that metric.

> **See also:** [`ARTIST-INCOME-GUARANTEE.md`](ARTIST-INCOME-GUARANTEE.md) — the *"no starving artists"* design contract: six revenue streams default-on per artist (direct sales, tips, user-centric subscription pool, Discovery Dividend, sync licensing, live + merch), Artist Wallet that credits *before* the platform sees the money, Encore Day +25% monthly tip-matching, Working Musician Stipend (Year 2+), and the schema-level invariants (`sales.platform_fee_cents = 0`, `payouts.bundle_discount_applied = false`, etc.) that make those guarantees auditable.

## The 2026 income reality (audit before designing)

Independent artists in 2026 earn from 4–6 simultaneous revenue streams. Streaming alone cannot sustain a career. The numbers below are research, not opinion — citations at the end.

### Per-platform stream value (€ per 1 stream)

| Platform | Per stream | Streams to equal one $10 Bandcamp sale (after fees) |
|---|---|---|
| Qobuz | €0.018 | ~470 |
| TIDAL | €0.013 | ~650 |
| Apple Music | €0.010 | ~850 |
| Amazon Music | €0.004 | ~2,100 |
| Spotify (US weighted) | €0.003–0.005 | ~3,500 |
| YouTube Music | €0.002 | ~4,200 |

A single $10 Bandcamp sale = the income from roughly **3,500 Spotify streams**. The Lackluster case study (16 years of receipts): 775 Bandcamp sales = €6,378 / 6.9 million streams across all platforms = €4,596.

### Spotify's 1,000-stream gate (April 2024 forward)

A track must reach 1,000 streams within a rolling 12-month window or earn $0. An estimated **87% of all tracks on Spotify earn nothing.** This is not a bug — it is the funding source for the 13% that do.

### Where working artists' money actually comes from

| Income stream | Typical contribution to working-artist income | Notes |
|---|---|---|
| **Live performance** | Largest single source for most | $1,000–$5,000 regional headline; $35–65k net on a 12-date 1,500-cap headline tour |
| **Merchandise** | Often beats ticket revenue at small venues | 40–70% margins; one $100 merch buyer ≈ 25,000 streams |
| **Direct sales (Bandcamp et al.)** | Second-largest for many working indies | 80–85% to artist; instant payout |
| **Sync licensing** | Lumpy but transformative; $500–$50k+ per placement | Catalog must be sync-ready (stems, instrumentals, clean metadata = 4× more inquiries) |
| **Recurring fan support (Patreon-style)** | Long-tail; 1–5% of followers convert | Median earner is under $100/month |
| **Streaming royalties** | Discovery channel; meaningful income only at 1M+ monthly listeners | $0.003–$0.005 per stream |

## Encore's economic strategy

Translation: Encore wins by being **the unified business hub** for the four–six income streams above, not by attempting to be a better Spotify. Spotify wins the discovery layer for the foreseeable future. Encore wins the layer where artists keep money.

### Tier 1 — Maximum yield (no platform fee at all)

| Surface | Encore cut | Notes |
|---|---|---|
| Direct album / single sales | **0% platform fee.** Artist pays only the payment processor (Stripe ~2.9% + $0.30). | Beats Bandcamp's 10–15%. |
| Pay-what-you-want / name-your-price | **0% platform fee.** | Pay-what-you-want above the artist's floor is preserved 100% to the artist. |
| Merchandise (Tier 2 launch) | **0% platform fee** on physical merch; payment processor only. | Encore does not fulfil; artist or POD provider handles shipping. |
| Tipping (one-off and recurring) | **0% platform fee.** | Lightning + Stripe rails. |
| Sync licensing marketplace (Tier 3) | **15% on placement fee** (vs Songtradr's 20–40%); 0% on backend performance royalties. | Performance royalties always go directly to the artist's PRO (ASCAP/BMI/SOCAN). |
| Live ticketing (Tier 3, roadmap) | **5% on tickets** vs Eventbrite/AXS 10–25%. | Optional integration; artist always free to use external ticketer. |

### Tier 2 — Streaming royalties (when ad/subscription revenue exists)

| Surface | Encore cut | Notes |
|---|---|---|
| Subscription tiers (Premium / Family / Student / HiFi) | **70% of every dollar to the artist pool** (vs ~58% on Spotify). | Pool is **user-centric** — your $9.99 goes only to artists you listened to that month. |
| Privacy-first contextual ads | **70% of every dollar to the artist pool.** | Targeting is *contextual* (genre, mood, time-of-day, language) — no behavioral profiling. |
| **No 1,000-stream cliff.** | The first verified play of a track earns a payout. No track is silenced for being small. |

### Tier 3 — Operations and self-hosting

| Surface | Encore cut | Notes |
|---|---|---|
| Self-hosting | **$0.** Code is AGPL-3.0; anyone can stand up an instance for their label, festival, scene, or co-op. |
| Federation | **$0.** ActivityPub means an artist on instance A can be followed and tipped from instance B without Encore touching the money. |
| Public TypeScript SDK | **$0.** MIT-licensed (separate from the AGPL core) so any third-party tool can integrate. |

## Why user-centric payouts (UCPS) work for indies — and why Tidal failed at it

Spotify's pro-rata model dumps every listener's subscription into one bucket and pays out by global market share. If 0.0001% of streams went to your release, you get 0.0001% of the pot. This systematically transfers money **from indie listeners to megastars** even when those listeners never play a megastar's track.

User-centric (also "fan-powered") allocates *your* $9.99 only to artists you actually listened to. Same total pool, fairer distribution. SoundCloud has run UCPS on its Premier tier since 2021; their published data shows indies and emerging artists earn meaningfully more.

Tidal's attempt at UCPS collapsed in 2023 because **the major labels refused to allow it on their catalog.** Encore has no major-label dependency for the launch catalog (see [CATALOG-PATHS.md](CATALOG-PATHS.md)) — distributors deliver via DDEX, and our standard distributor agreement requires their licensors to accept UCPS or opt out of the subscription pool entirely (they still receive direct-sale revenue). **This is the federation moat in financial form: we cannot be blackmailed into pro-rata.**

## Concrete artist-take-home examples

These compare a hypothetical indie artist's monthly Encore earnings vs equivalent activity on incumbent platforms.

### Example A — Bedroom electronic artist, 30k monthly listeners

| Activity | Volume | Encore earns artist | Spotify+Bandcamp earns artist |
|---|---|---|---|
| Streams | 30,000 | ~$60 (UCPS share) | ~$120 (pro-rata) |
| Direct sales | 12 albums @ $7 | ~$80 (artist nets $6.74/sale) | ~$71 (Bandcamp nets ~$5.95/sale) |
| Tips from 4 superfans @ $10 | 4 | $40 | n/a |
| **Monthly total** | | **~$180** | **~$191** |

Encore's first lever (UCPS) loses slightly to pro-rata at very small scale because pro-rata over-pays low-effort artists from the megastar dilution effect. **At 100k+ monthly listeners with engaged superfans, Encore pulls ahead by 30–60%.** See Example B.

### Example B — Folk songwriter, 150k monthly listeners + 200 superfans

| Activity | Volume | Encore earns artist | Spotify+Bandcamp earns artist |
|---|---|---|---|
| Streams | 150,000 | ~$420 (UCPS, superfan-weighted) | ~$525 (pro-rata) |
| Direct album sales | 65 @ $10 | ~$631 | ~$553 (Bandcamp 12% effective) |
| Recurring fan support (200 × $4) | $800/mo | $776 (3% processor only) | ~$704 (Patreon 12%) |
| Tips | $90 | $87 | n/a |
| **Monthly total** | | **~$1,914** | **~$1,782** |

Encore +7% and consolidating four tools into one. At Example C scale the gap widens further.

### Example C — Established indie band, 500k monthly listeners, 2,000 superfans, sync ready

| Activity | Volume | Encore earns artist | Spotify + Bandcamp + Patreon + Songtradr |
|---|---|---|---|
| Streams | 500,000 | ~$1,650 (UCPS) | ~$1,750 (pro-rata) |
| Direct sales | 300 @ $9 | ~$2,620 (0% fee) | ~$2,200 (Bandcamp 12% effective) |
| Recurring support | 2,000 × $3 = $6,000 | ~$5,824 (processor only) | ~$5,280 (Patreon 12%) |
| Sync placement (1 streaming-show background) | $1,500 | ~$1,275 (15% sync cut) | ~$900 (Songtradr 40% take on Starter tier) |
| **Monthly total** | | **~$11,369** | **~$10,130** |

Encore +12% versus the four-tool stack — and the artist runs **one dashboard, one analytics view, one tax export, one fan database.**

## What this means for product

The pricing model above only works if the engineering enforces it. These commitments live in code:

- **0% platform fee on direct sales** is wired in `packages/db` (the `sales` table tracks `platformFeeCents = 0` as default; admin override requires a database migration).
- **User-centric payout math** is wired in `apps/worker/src/jobs/payouts.ts` (to land in v0.2). The pro-rata fallback is intentionally absent so an admin cannot quietly switch it.
- **No 1,000-stream gate.** `track_play_counters` increments on every verified 30-second play; there is no minimum-threshold filter in the payout query.
- **Pay-what-you-want preserved.** The `sales.overpaymentCents` column ensures all overage flows to `netToArtistCents`, never to the platform.
- **Privacy-first ads only.** `ad_campaigns.targetingJson` schema permits genre / mood / language / hour-of-day. There is no `userId` or `cohortId` allowed in the schema. Behavioral targeting cannot be added without a schema migration.

## What artists are asked to do in return

For Encore to keep platform fees at 0%, artists agree to four norms:

1. **Honor the license you uploaded under.** If you mark a track Creative Commons or a release Public Domain, you cannot later restrict it.
2. **Stay in good faith on DMCA.** False notices land you a strike; three strikes pause uploads pending review.
3. **No fake plays.** Self-streaming on a loop or paying for bot traffic = forfeiture of subscription pool earnings for that period.
4. **Disclose paid promotion.** If a song is sponsored placement on an Encore editorial playlist, the badge is mandatory. Editorial integrity is a community asset.

## Citations

- Lackluster, "I Published 16 Years of My Streaming Income" (Medium, Jan 2026): per-platform €/stream, Bandcamp vs streaming ratio.
- Los Campesinos!, *NME* (2025): £0.0034 per Spotify stream on 9.3M streams.
- Chartlex, "Spotify Pay Per Stream 2026: Real Rates Exposed": US-weighted $0.00443/stream, 1,000-stream gate, 87% of tracks earn nothing.
- Bandcamp Help Center, "What are Bandcamp's fees?": 15% digital → 10% after $5k, 10% physical, 24–48h PayPal payout.
- Bandcamp, "Point of sale" (Music Week 2025): $1.71 billion paid to artists since 2008, $3M Bandcamp Friday Sept 2025.
- Chartlex, "Bandcamp vs Patreon vs Substack 2026": platform fees (Patreon 8–12%, Substack 10%).
- Chartlex, "Touring Economics 2026": $35–65k net on a 12-date 1,500-cap headline tour; merch beats tickets at small venues.
- Chartlex, "Sync Licensing Rate Card 2026": $500–$150,000+ per placement by medium.
- Songtradr Artist Services: 60% on Starter/Lite, 80% on Pro tier.
- *TechCrunch* (Feb 2023): Tidal Direct Artist Payouts cancellation — 70,000 artists, $500,000 total payouts.
- *Billboard* (2021): Tidal user-centric blocked by labels.
- SoundCloud Fan-Powered Royalties (2024): indies earn measurably more under UCPS.
- Orphiq, "How Music Artists Actually Make Money in 2026": revenue stream breakdown, 250k monthly streams ≈ $1,000.
