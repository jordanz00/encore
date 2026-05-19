# Role 03 — Bandcamp & Bandcamp Friday Audit

## Mission
Bandcamp is Encore's spiritual ancestor for the **direct-sales, fan-supports-artist** half of the model. Audit what Bandcamp got right (artist-controlled pricing, name-your-price, vinyl pre-orders, fan accounts that own their downloads, the Bandcamp Friday fee waiver), what it got fragile about (single-owner platform risk through the Epic → Songtradr → Songtradr-after-layoffs chain), and translate the durable bits into Encore's `sales`, `releases`, and `payouts` tables in `packages/db/src/schema.ts` and the Stripe wiring in `apps/api/src/routes/payments.ts`.

## Keep
- **Artist-set pricing and "name your price."** Buyer pays at least the floor; many pay more. Already modelled: `releases.priceFloorCents`, `tracks.priceCents`, and `sales.overpaymentCents` capture the overpay above the floor without losing it to fees.
- **0% to 0%-ish platform fee on direct sales.** Bandcamp historically took ~10–15 % plus payment processor; we go further: target 0 % platform fee on artist sales, payment processor only. Already a target in `sales.platformFeeCents` (default 0) and a separate `processorFeeCents` line.
- **Fan accounts that own purchases forever.** The download you bought is yours, with lossless FLAC and full metadata. Maps to `sales.releaseId` / `sales.trackId` as the receipt of record; download is generated from `tracks.flacKey` and `tracks.masterKey`.
- **Vinyl / merch / cassette pre-orders.** Physical SKUs alongside digital. v2 schema work (a `merch_items` / `physical_skus` table tracked under a future RFC).
- **Bandcamp Friday** — a recurring, branded "first Friday of the month, fees waived" event. Cheap to reproduce: a periodic worker job in `apps/worker/src/jobs/` flips a config flag the `payments` route reads when computing `platformFeeCents`. Powerful as a community ritual.
- **Free streaming as a try-before-you-buy** — a few full plays per track per listener, then a buy nudge. Honest version of Spotify's "free tier."
- **Fan-feed of supported artists.** A timeline of new releases from artists you've bought from / followed. Maps to `follows` plus `sales.buyerUserId`.

## Drop
- **Single-owner platform risk.** Bandcamp's ownership has changed hands twice in three years and a substantial part of the staff was laid off after the Songtradr deal. Encore's answer: AGPL-3.0, federation-capable (`artists.actorIri`, `releases.objectIri`), and self-hostable from the start.
- **Limited social / discovery surface.** Bandcamp leans on editorial (Bandcamp Daily) and tag pages; algorithmic discovery is intentionally minimal. We add content-based recs (`tracks.embedding`, `docs/rfcs/004-recommendations.md`) without breaking the artist-first stance.
- **Patchy app experience.** The mobile app has felt second-class to the website for years. We invest in mobile from day one (Role 17).
- **No federation / no portability** of fan accounts to other instances.

## Recommendations for Encore
1. **Name-your-price as the default upload UX.** When an artist sets `priceFloorCents = 0`, the buy button reads "Name your price (minimum free)" and the form captures `overpaymentCents`. Tip jar pattern reused on artist profile via `payouts.tipsCents`.
2. **Encore Friday.** Worker-triggered fee waiver: on the first Friday UTC of each month, `apps/api/src/routes/payments.ts` sets `platformFeeCents = 0` and shows a "Fees waived today" badge. Visible in the artist payout breakdown so they can see the lift.
3. **Owned downloads = real files.** Owned downloads from `sales` resolve to a streaming URL of `tracks.flacKey` plus a one-click ZIP including artwork (`releases.coverArtKey`), text credits (`releases.credits`), and an `info.json` sidecar. Mobile / desktop "Owned" library never expires; documented in Role 17.
4. **Pre-orders as scheduled releases.** `releases.status = 'scheduled'` + `releases.releaseDate` already supports pre-order; add a `salesAvailableAt` column when we add physical SKUs.
5. **Fan support feed** in `apps/web/src/app/` reading `follows` ∪ artists with prior `sales`. Push notifications opt-in only.
6. **Transparent fee maths in the UI.** On every checkout, show: artist net, processor fee, platform fee (often 0). No hidden splits.

## Open Questions
- Vinyl / merch fulfilment — partner (e.g. a print-on-demand and short-run pressing partner) or stay digital-only for v1 and add a marketplace later?
- Sales tax / VAT collection thresholds — Stripe Tax covers a lot, but EU VAT MOSS for digital downloads is a real obligation we'll need legal review on before opening to EU sellers.
- "Free download in exchange for an email" pattern — useful for artists building a list, or a privacy footgun we should refuse to build?
- How aggressive is the `Encore Friday` cadence? Monthly ≠ weekly. Quarterly might preserve the moment better.
- Should fan accounts be portable between Encore instances via ActivityPub, or is purchase history strictly local-instance?
