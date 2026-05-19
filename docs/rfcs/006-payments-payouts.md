# RFC 006 — Payments & Payouts

## Status

Proposed.

## Context

Spotify pays approximately $0.003–$0.005 per stream under a pro-rata model: all subscription and ad revenue goes into one global pool split across rights-holders by share of total streams. The well-documented result is that megastars and stream farms harvest the pool while working artists earn pennies. Encore rejects pro-rata. We use a **user-centric payout model** (UCPS): each subscriber's monthly fee is split only across the artists THAT specific subscriber actually listened to. SoundCloud's "fan-powered royalties" and Deezer's UCPS pilot are the precedents.

## Decision

### Subscription tiers

| Tier | Price (USD/mo) | Features |
|---|---|---|
| Free | $0 | Privacy-first contextual ads; 256 kbps AAC max |
| Premium | $9.99 | Ad-free; 320 kbps AAC; offline; all devices |
| Family | $15.99 | 6 Premium accounts; kids profile |
| Student | $4.99 | Premium for verified students |
| HiFi | $14.99 | Premium + lossless FLAC + binaural spatial |

Prices are placeholders; final pricing TBD by maintainer council.

### Direct sales (Bandcamp model)

- Artist sets `releases.priceFloorCents`; listener can pay over.
- Stripe Connect Express per artist.
- **Encore platform fee on direct sales: 0%.** Artist keeps everything except Stripe processor fee (~2.9% + $0.30).
- Recorded in `schema.sales` with full breakdown.

### Subscription payouts (user-centric)

Monthly, per subscriber:

1. Compute the subscriber's total verified plays for the month.
2. Compute net contribution: `subscription_price - stripe_fees - platform_overhead_share`. Platform overhead target: ≤ 10% of subscription net.
3. For each artist the subscriber listened to: `(plays_of_artist / total_plays) * net_contribution`.
4. Sum across all subscribers per artist; that's the monthly payout.
5. Recorded in `schema.payouts`.

### Tipping

- `payments/checkout` with `kind=tip`. 0% platform fee (only Stripe). Recorded in `schema.payouts.tipsCents`.

### Alternative payment rails

- Stripe is primary.
- Liberapay, Open Collective, BTCPay are documented as artist-side alternatives the artist links from their profile. Encore does not process those funds.

### Tax handling

- US: Stripe Connect generates 1099-K / 1099-NEC where required.
- Canada: T5 export.
- EU + UK: Stripe Tax for VAT.
- Annual statement available per artist.

### Refunds + chargebacks

- Refunds within 30 days of purchase.
- Chargebacks debited from artist's next payout; artist can submit evidence package.

### Currency

- Stripe handles conversion to artist's payout currency.
- Listener charged in local currency where supported.

## Alternatives Considered

| Model | Why not |
|---|---|
| Pro-rata (Spotify default) | Mathematically favors megastars and stream farms |
| Per-stream fixed payout | Trivially gameable; bankrupts the platform |
| Pay-per-listen with no subscription | Friction; deters casual listeners |
| Crypto-token rewards (Audius) | Speculative; attracted wash trading more than listeners |

## Consequences

- Subscription accounting is more complex per-subscriber than pro-rata; payouts compute in the analytics warehouse (RFC 008-adjacent post-warehouse adoption).
- Platform overhead must remain low; AGPL-3.0 OSS staffing supported by grant pipeline (RFC 008).
- 0% platform fee on direct sales means subscription revenue carries operating cost.

## Open Questions

- Hard cap on payout to a single artist per subscriber per month (anti-stream-farm)?
- Country-specific minimum payout threshold before transfer fees eat the deposit?
- Platform-level multi-collaborator splits, or hand off to dedicated services like Stem?
- Stripe Tax sufficient for non-EU non-US jurisdictions, or integrate Avalara?
