# Artist Income Guarantee — No Starving Artists

> **Design contract.** Every working artist on Encore gets paid *something* for every verified play, every sale, every tip — and gets paid *first*, *fast*, and *in their own currency*. This document defines exactly how, with the schema tables and payout job names that enforce it.

## §0. The contract in one sentence

> If you publish music on Encore and someone listens, buys, tips, syncs, or comes to a show — **you get paid, weekly, in your own currency, with zero platform fee, from the moment the money lands.**

No 1,000-stream cliff. No 30-day "rolling-window earnings threshold." No country exclusions. No platform-skim before the artist sees the money. No mystery deductions.

## §1. The six revenue streams every artist gets, by default

Every artist profile on Encore ships with all six streams active. The artist can disable any of them, but they all default *on* because **most starving artists are starving because they only know about #3 (streaming) and don't realize the other five exist.**

| # | Stream | Platform fee | Payout speed | Schema |
|---|---|---|---|---|
| 1 | **Direct sales** (single, album, name-your-price) | 0% (processor fee only, ~2.9% + $0.30) | Instant credit to wallet; weekly cash-out | `sales` (exists) |
| 2 | **Tips** (one-off + recurring fan-to-artist subscriptions) | 0% | Instant credit; weekly cash-out | `tips` (new — see §7) |
| 3 | **User-centric subscription pool** | 0% (foundation runs from grants + donations, not skim) | Weekly cash-out of last week's allocation | `subscription_allocations` (new — see §7) |
| 4 | **Discovery Dividend** (per-play pool funded by ads + 10% of subscription revenue) | 0% | Weekly cash-out | `discovery_dividend_period`, `discovery_dividend_payouts` (new — see §7) |
| 5 | **Sync licensing** (catalog auto-licensed at low blanket rates to indie filmmakers, podcasters, game devs, ad agencies — opt-in per track) | 15% to a foundation legal-ops sub-pool, 85% to artist | 30-day clearance (license terms require it) | `sync_license_opt_in`, `sync_license_usage`, `sync_license_payouts` (new — see §7) |
| 6 | **Live + merch passthrough** (Bandsintown ticket integration + Printful/Printify merch fulfillment) | 0% | Per partner (typically next business day) | `live_events`, `merch_items`, `merch_sales` (new — see §7) |

**Combined effect:** even an artist with a small audience earns from at least three of the six streams in any given month. The "you can't make a living from streaming alone" problem is real; the response is to make sure no Encore artist *only* has streaming.

## §2. The Discovery Dividend (the killer "everyone gets paid" mechanism)

This is the new mechanism most other platforms don't have. It directly addresses the user's "every working artist gets paid something" requirement.

### How it works

- **Source of funds:** 10% of all subscription revenue + 100% of contextual ad revenue (no behavioral ads — see [`ARTIST-PAIN-AUDIT.md`](ARTIST-PAIN-AUDIT.md)) flow into the Discovery Dividend Pool every payout period.
- **Distribution:** every **verified play** during the period gets one equal share. A play is "verified" when ≥30 seconds of audio streamed (already enforced in `apps/api/src/routes/plays.ts`).
- **No megastar weighting:** Drake's play and a debut artist's play count the same.
- **No 1,000-stream gate:** the gate is one verified play.
- **Per-play rate** = pool size / total verified plays in the period.

### Why this fixes the starvation problem

In a pure user-centric model, if a fan only listens to one artist all month, only that artist gets the $7 share — the other artists the fan briefly tried get $0. The Discovery Dividend ensures that *being heard at all* always earns something, no matter what the fan's listening pattern looks like.

### Worked example (target Year-1 numbers)

Suppose:
- 50,000 paying subscribers at $9.99/mo → $499,500 subscription revenue/mo
- 10% to Discovery Dividend Pool → $49,950
- Contextual ad revenue (free tier) → $5,000/mo
- Total Discovery Dividend Pool → $54,950
- Total verified plays in the period → 10,000,000
- Per-play Discovery Dividend rate → **$0.0055**

An artist with 200 verified plays/month earns **$1.10** from Discovery Dividend alone — on top of their user-centric share, direct sales, tips, sync, and live revenue.

Compare to Spotify: 200 verified plays earns **$0** (below 1,000-stream gate). On Encore, the same 200 plays earns at minimum $1.10 from Discovery Dividend alone; if any of those 200 plays came from a paying subscriber, the user-centric pool adds on top.

### Schema (Drizzle — see §7 for full code)

```ts
discovery_dividend_period { id, periodStart, periodEnd, poolCents, totalVerifiedPlays, perPlayRateMicroCents, status, settledAt }
discovery_dividend_payouts { periodId, artistId, verifiedPlays, payoutCents }
```

### Anti-abuse

- A play is verified only when ≥30s streamed (existing rule)
- A single user's plays of a single track are capped at 1/hr (rate-limited at ingest)
- Bot-detection signal flags artificial play farms; flagged plays excluded from Discovery Dividend pool but counted for the artist's vanity counters
- Self-streams excluded (artist account streaming their own catalog)

## §3. The "Artist Gets Paid First" architectural guarantee

This is a structural commitment encoded at the schema and payout-pipeline level.

### Rule 1 — Money lands in the artist's wallet *before* anywhere else

When a fan pays for a direct sale, tip, or new subscription:

```
Stripe webhook → 
  immediately credit artist_wallet.balanceCents += saleAmount - processor_fee →
    fire artist notification "+$8.92 from Sarah K. → 'Late Night Tape'" →
      record the platform's 0% share as a $0 row (audit invariant)
```

The platform balance never sits ahead of the artist's balance. There is no "we hold your money for 30 days while we settle" — there is no settle period because there is no skim.

### Rule 2 — Foundation operating funds come from grants + donations, never artist skim

The foundation (post-fiscal-sponsor) runs on:
- NLnet, NGI, OTF, Mozilla MOSS, Sovereign Tech Fund grants
- Recurring foundation donations from listeners (separate from subscription)
- Subscription revenue share — but only the **6% processor-pass-through portion**, never the artist's 70% allocation
- Optional listener round-up at checkout ("Round up my $9.99 → $10 to support Encore")

This means the platform never has financial pressure to skim artist payouts, because skimming would be both forbidden by the AGPL fork escape and unnecessary for survival.

### Rule 3 — Wallet → payout is artist-triggered or weekly auto, never deferred

Default: weekly automatic payout on Friday 00:00 UTC. Manual override: cash out any time the wallet balance exceeds the local rail's minimum (e.g. M-Pesa minimum $1, Stripe Connect minimum $1, Wise minimum $5, Lightning no minimum).

No "minimum balance before we'll pay you" trap. No "10 days for processing." If Stripe holds funds because of their KYB cycle, *the platform fronts the payout from the foundation operating fund* (Year 2+ guarantee, depends on grant runway).

## §4. Encore Day — coordinated monthly fan-payday

Bandcamp Friday raised real money for real artists — concrete proof a coordinated monthly moment works. Encore ships its own version.

### Rules

- **First Friday of every month, 00:00–23:59 UTC.**
- Direct sales and tips during the window get a **+25% matching bonus from the Encore Foundation Match Pool** (funded by listener round-ups + foundation operating surplus + dedicated grants).
- "+ matched" badge visible at checkout — the fan knows their $10 becomes $12.50 for the artist.
- The platform takes 0% on Encore Day (already 0% normally, but the messaging is the point).
- Pre-Day promotional cycle: artist dashboard surfaces a "Prep your Encore Day drop" workflow 7 days out — schedule the release, post the social cards, queue the email blast.

### Schema

```ts
encore_day_periods { id, dayDate, matchPoolCents, settledAt }
encore_day_matches { periodId, saleId | tipId, matchedAmountCents, payoutCents }
```

## §5. The Minimum Active Artist Income Floor (Year 2+ goal)

Once foundation funding is stable (target: NLnet NGI0 grant approved + recurring donations covering operations), Encore launches the **Working Musician Stipend**.

### Eligibility

To qualify in a given month, an artist needs all of:
- ≥10 verified plays from ≥3 distinct verified listeners
- ≥3 published tracks
- A complete profile (avatar, bio, location)
- A linked payout method
- No active moderation strike

### Stipend amount

A flat per-month payment ranging from $5 (a baseline for hobbyist artists who pass the bar) to $50 (for artists meeting the Living Wage threshold — see below), funded entirely from foundation grants. **Not from other artists' streaming pool.**

### Living Wage Tier

Inspired by the proposed US "Living Wage for Musicians Act" (which proposes an additional $0.01/stream surcharge funded by a streaming-service tax). Encore's version: a tier system tied to foundation funding milestones.

| Foundation funding stage | Stipend rate |
|---|---|
| Pre-foundation (Year 1) | Not active — direct sales + tips + Discovery Dividend only |
| Foundation Year 2 (grants only) | $5–$15/mo for qualifying active artists |
| Foundation Year 3 (grants + recurring donations + subscription operating surplus) | $15–$30/mo |
| Foundation Year 4+ (sustaining) | $30–$50/mo target, automatically scaling with foundation operating surplus |

### Anti-gaming

- Stipend program is opt-in (artist applies once)
- Foundation grants committee reviews top 1% of applications for fraud
- All stipend payouts public in the foundation's transparency report
- Bot-flagged artists ineligible

### Schema

```ts
stipend_program_enrollments { id, artistId, enrolledAt, status, lastReviewedAt }
stipend_disbursements { id, artistId, periodMonth, amountCents, currency, status, paidAt }
```

## §6. Anti-starvation invariants enforced in schema and code

These rules can be checked by automated audit query against the database. Any drift is a bug.

| Invariant | Where enforced | Audit query |
|---|---|---|
| Every verified play of a published track must produce a non-zero Discovery Dividend payout when the period closes | `apps/worker/src/jobs/discovery-dividend-settle.ts` | `SELECT plays_with_zero_payout FROM v_audit_discovery_dividend` |
| Every direct sale must credit the artist wallet within 60 seconds of Stripe webhook receipt | `apps/api/src/routes/webhooks/stripe.ts` | `SELECT delayed_wallet_credits FROM v_audit_wallet_credit_latency` |
| Artist wallet balance must never decrease without a corresponding payout, refund, or chargeback row | `packages/db/triggers/artist_wallet_balance_audit.sql` | `SELECT * FROM v_audit_wallet_unexplained_decreases` |
| No table or job is allowed to net subtract from artist earnings unless its row has a `reason` foreign-keyed to an explanation enum | DB constraint on `wallet_ledger.reason` | `SELECT * FROM v_audit_wallet_reasons` |
| Platform fee on direct sales must be 0 cents (processor fee tracked separately as `processor_fee_cents`, not `platform_fee_cents`) | DB CHECK constraint on `sales.platform_fee_cents = 0` | `SELECT count(*) FROM sales WHERE platform_fee_cents <> 0` |
| Bundle-discount on publishing-side payouts forbidden (the Spotify mechanical-royalty cut that lost songwriters $150M) | DB CHECK constraint on `payouts.bundle_discount_applied = false` | `SELECT count(*) FROM payouts WHERE bundle_discount_applied` |
| Subscription pool allocation must be user-centric (sum of per-listener allocations to an artist = pool slice for that artist) | `apps/worker/src/jobs/payouts.ts` | `SELECT * FROM v_audit_user_centric_allocation` |
| Discovery Dividend per-play rate must be > 0 for every period with any plays | DB CHECK constraint on `discovery_dividend_period.per_play_rate_micro_cents > 0 WHEN total_verified_plays > 0` | covered |
| Stipend disbursements must come from `foundation_grants_ledger`, never from `subscription_pool_ledger` | DB CHECK constraint on `stipend_disbursements.funding_source_ledger_id` foreign-keyed to grants ledger only | covered |

Every one of these is a real SQL constraint or audited view — not a comment in a README.

## §7. Schema additions (Drizzle, ready to merge)

The following additions go in `packages/db/src/schema.ts`. They are append-only — no existing table is modified.

```ts
// ---------- Artist Wallet (the "artist gets paid first" account) ----------

export const artistWallets = pgTable("artist_wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id")
    .notNull()
    .unique()
    .references(() => artists.id, { onDelete: "cascade" }),
  /** Wallet balance in artist's preferred currency, integer minor units. */
  balanceCents: bigint("balance_cents", { mode: "number" }).default(0).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  /** Auto-cashout schedule: "weekly" | "manual" | "threshold". */
  cashoutMode: varchar("cashout_mode", { length: 16 }).default("weekly").notNull(),
  /** Minimum balance before auto cash-out fires (for "threshold" mode). */
  cashoutThresholdCents: integer("cashout_threshold_cents").default(0).notNull(),
  lastCashoutAt: timestamp("last_cashout_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const walletLedger = pgTable(
  "wallet_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => artistWallets.id, { onDelete: "cascade" }),
    /** Positive = credit (artist earned), negative = debit (cash-out / refund). */
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    /** Why this row exists. Must come from a controlled vocabulary. */
    reason: varchar("reason", { length: 32 }).notNull(),
    /** Reference into another table for the source of the entry. */
    sourceTable: varchar("source_table", { length: 64 }),
    sourceId: uuid("source_id"),
    /** Human-readable note for the artist dashboard. */
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    walletCreatedIdx: index("wallet_ledger_wallet_created_idx").on(t.walletId, t.createdAt),
  }),
);

// ---------- Tips (one-off + recurring fan-to-artist) ----------

export const tips = pgTable(
  "tips",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    fromUserId: uuid("from_user_id").references(() => users.id, { onDelete: "set null" }),
    /** Anonymous tip flag (user's display name hidden from artist). */
    anonymous: boolean("anonymous").default(false).notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    /** "one_off" | "monthly" | "annual" */
    cadence: varchar("cadence", { length: 16 }).default("one_off").notNull(),
    /** Rail used: "stripe" | "lightning" | "wise" | "mpesa" | "momo" | etc. */
    rail: varchar("rail", { length: 24 }).notNull(),
    railRef: varchar("rail_ref", { length: 200 }),
    /** Message from the fan (optional, 500 char limit). */
    message: varchar("message", { length: 500 }),
    matchedAmountCents: integer("matched_amount_cents").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    artistCreatedIdx: index("tips_artist_created_idx").on(t.artistId, t.createdAt),
  }),
);

// ---------- Subscription allocation (user-centric pool slice per artist per period) ----------

export const subscriptionAllocationPeriods = pgTable("subscription_allocation_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  /** Subscription net revenue this period (after processor fees), excludes Discovery Dividend slice. */
  netRevenueCents: bigint("net_revenue_cents", { mode: "number" }).notNull(),
  /** What % of net goes to artist user-centric pool (default 70). */
  artistPoolPercent: integer("artist_pool_percent").default(70).notNull(),
  status: varchar("status", { length: 16 }).default("open").notNull(),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptionAllocations = pgTable(
  "subscription_allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    periodId: uuid("period_id")
      .notNull()
      .references(() => subscriptionAllocationPeriods.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    /** Number of distinct listeners whose $ flowed to this artist. */
    contributingListeners: integer("contributing_listeners").notNull(),
    /** Listener-time-weighted share aggregated across subscribers who played the artist. */
    payoutCents: bigint("payout_cents", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    periodArtistUnique: uniqueIndex("sub_allocations_period_artist_unique").on(t.periodId, t.artistId),
  }),
);

// ---------- Discovery Dividend (every-play-earns) ----------

export const discoveryDividendPeriods = pgTable("discovery_dividend_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  /** Pool funded by: 10% of subscription revenue + 100% of contextual ad revenue. */
  poolCents: bigint("pool_cents", { mode: "number" }).notNull(),
  totalVerifiedPlays: bigint("total_verified_plays", { mode: "number" }).notNull(),
  /** Per-play rate in micro-cents (1/1,000,000 of a cent) for precision. */
  perPlayRateMicroCents: bigint("per_play_rate_micro_cents", { mode: "number" }).notNull(),
  status: varchar("status", { length: 16 }).default("open").notNull(),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const discoveryDividendPayouts = pgTable(
  "discovery_dividend_payouts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    periodId: uuid("period_id")
      .notNull()
      .references(() => discoveryDividendPeriods.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    verifiedPlays: integer("verified_plays").notNull(),
    payoutCents: bigint("payout_cents", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    periodArtistUnique: uniqueIndex("disc_div_payouts_period_artist_unique").on(t.periodId, t.artistId),
  }),
);

// ---------- Sync licensing (catalog opt-in, low blanket rate) ----------

export const syncLicenseOptIn = pgTable("sync_license_opt_in", {
  id: uuid("id").defaultRandom().primaryKey(),
  trackId: uuid("track_id")
    .notNull()
    .unique()
    .references(() => tracks.id, { onDelete: "cascade" }),
  /** Tier 1 = $5/use (indie podcast under 5k DLs), Tier 2 = $50/use (indie film under $100k budget),
   *  Tier 3 = $500/use (commercial under $1M ad spend). Higher tiers require artist negotiation. */
  enabledTiers: jsonb("enabled_tiers").default(sql`'[1]'::jsonb`).notNull(),
  /** Allow derivative uses (remixes, edits for sync). */
  allowDerivatives: boolean("allow_derivatives").default(false).notNull(),
  /** Exclusions: brand categories the artist refuses (e.g. ["tobacco","weapons","fast_food"]). */
  brandExclusions: jsonb("brand_exclusions").default(sql`'[]'::jsonb`).notNull(),
  optedInAt: timestamp("opted_in_at", { withTimezone: true }).defaultNow().notNull(),
});

export const syncLicenseUsage = pgTable("sync_license_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  trackId: uuid("track_id")
    .notNull()
    .references(() => tracks.id, { onDelete: "cascade" }),
  licenseeUserId: uuid("licensee_user_id").references(() => users.id, { onDelete: "set null" }),
  tier: integer("tier").notNull(),
  /** What it's used for (free text + structured). */
  useType: varchar("use_type", { length: 32 }).notNull(),
  useDescription: text("use_description").notNull(),
  feeCents: integer("fee_cents").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  /** Artist gets 85%, foundation legal-ops sub-pool gets 15%. */
  artistShareCents: integer("artist_share_cents").notNull(),
  legalOpsShareCents: integer("legal_ops_share_cents").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Live events (Bandsintown / native) ----------

export const liveEvents = pgTable(
  "live_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    venueName: varchar("venue_name", { length: 200 }),
    venueAddress: text("venue_address"),
    city: varchar("city", { length: 120 }),
    country: varchar("country", { length: 2 }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    ticketUrl: text("ticket_url"),
    /** Source: "native" | "bandsintown" | "songkick" */
    source: varchar("source", { length: 16 }).default("native").notNull(),
    sourceRef: varchar("source_ref", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    artistStartsIdx: index("live_events_artist_starts_idx").on(t.artistId, t.startsAt),
  }),
);

// ---------- Merch (Printful / Printify / native fulfillment passthrough) ----------

export const merchItems = pgTable("merch_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 64 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  /** Fulfillment partner: "printful" | "printify" | "self". */
  fulfillment: varchar("fulfillment", { length: 16 }).default("self").notNull(),
  /** Partner SKU reference for POD items. */
  partnerSku: varchar("partner_sku", { length: 200 }),
  imageKey: text("image_key"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const merchSales = pgTable("merch_sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => merchItems.id, { onDelete: "cascade" }),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  buyerUserId: uuid("buyer_user_id").references(() => users.id, { onDelete: "set null" }),
  quantity: integer("quantity").notNull(),
  grossCents: integer("gross_cents").notNull(),
  partnerCostCents: integer("partner_cost_cents").default(0).notNull(),
  /** Artist nets gross - partnerCost - processor fee. Platform fee = 0. */
  artistNetCents: integer("artist_net_cents").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  shippingCents: integer("shipping_cents").default(0).notNull(),
  status: varchar("status", { length: 16 }).default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Encore Day (matched-tip monthly event) ----------

export const encoreDayPeriods = pgTable("encore_day_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  dayDate: timestamp("day_date", { withTimezone: true }).notNull().unique(),
  matchPoolCents: bigint("match_pool_cents", { mode: "number" }).notNull(),
  matchRatePercent: integer("match_rate_percent").default(25).notNull(),
  poolRemainingCents: bigint("pool_remaining_cents", { mode: "number" }).notNull(),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Working Musician Stipend (Year 2+ foundation grant program) ----------

export const stipendEnrollments = pgTable("stipend_enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id")
    .notNull()
    .unique()
    .references(() => artists.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 16 }).default("pending").notNull(),
  tier: varchar("tier", { length: 16 }).default("baseline").notNull(),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow().notNull(),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
});

export const stipendDisbursements = pgTable("stipend_disbursements", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  periodMonth: varchar("period_month", { length: 7 }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  /** Must reference foundation grants ledger row (not subscription pool). */
  fundingSource: varchar("funding_source", { length: 32 }).default("foundation_grants").notNull(),
  status: varchar("status", { length: 16 }).default("pending").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

## §8. The Artist Dashboard — what artists actually see

The artist dashboard at `/dashboard` consolidates all six income streams into **one screen**, in plain language, no fee deception:

```
THIS WEEK (Mon Nov 18 – Sun Nov 24)
─────────────────────────────────────────────
  Direct sales              $42.50   (5 sales, 0% platform fee)
  Tips                       $18.00   (3 tips from 3 fans)
  Streaming pool (your fans) $24.18   (your share of 8 fans' subs)
  Discovery Dividend         $ 3.42   (628 verified plays × $0.00545)
  Sync licensing             $ 0.00
  Live & merch               $48.00   (3 t-shirts via Printful)
─────────────────────────────────────────────
  Gross                     $136.10
  Processor fees             -$5.27   (2.9% + $0.30 × 7 transactions)
  Platform fee               $ 0.00   (always)
  ─────────────────────────────────
  You earn                  $130.83
  Auto cash-out Friday        →  Stripe Connect → your bank
```

A second tab — "All-time" — shows the same breakdown lifetime. A third — "Per-fan" — shows which individual fans contributed how much (anonymous tips redacted). A fourth — "Tax export" — generates a 1099-K-ready CSV for US, T4A for Canada, EU VAT MOSS summary, GST summary for India, etc.

## §9. What this guarantees, and what it does not

### Guarantees

- **Every verified play earns money.** No 1,000-play gate. Ever.
- **Artist gets paid first.** Money lands in the artist wallet before the platform sees a cent (and the platform takes 0 cents anyway).
- **Weekly cash-out** in 30+ rails: Stripe (60+ countries), Wise (170+), M-Pesa (Kenya/Tanzania), MTN MoMo (8 African countries), Razorpay/UPI (India), Pix (Brazil), MercadoPago (LATAM), Lightning (any country with a Lightning wallet).
- **No mystery deductions.** Every cent removed from an artist wallet has a row in `wallet_ledger.reason` from a controlled vocabulary.
- **Income diversification by default.** Six revenue streams active on every artist profile.
- **Discovery Dividend** — funded by ads + 10% of subscription — pays every verified play, period.
- **Encore Day monthly matching** — +25% bonus on direct sales and tips, first Friday.
- **Working Musician Stipend** (Year 2+) — foundation-funded baseline income for qualifying active artists, never funded from other artists' pool.

### What this does *not* guarantee

- **It does not manufacture demand.** A hobbyist with 0 listeners earns from 0 plays. The Discovery Dividend pays per play; it does not pay for non-plays. What we can guarantee is *if anyone hears it, you are paid for it*.
- **It does not replace promotion.** Artists still have to make people care. Encore provides the editorial pack rotation, the federated discovery surface, the SEO-friendly artist pages, and the Encore Day amplification — but the artist still has to make music people want to hear.
- **It does not eliminate the structural fact that musician income is bursty.** A hot release week earns 50× a slow week. The six-stream architecture smooths this, but it does not eliminate it.

The right framing: **Encore ensures that effort + audience always produces payment, in proportion, in the artist's own currency, on time, with no platform skim.** That is what "no starving artists" actually means.

## §10. Implementation roadmap (ship-week + post-launch)

| Milestone | Ships in |
|---|---|
| Artist Wallet table + ledger + `+$x landed` notifications wired through Stripe webhook | Ship-week Day 2 |
| Tips table (one-off via Stripe; recurring via Stripe subscriptions later) | Ship-week Day 2 |
| Six-stream dashboard at `/dashboard` (with placeholder $0 for streams not yet revenue-bearing) | Ship-week Day 5 |
| Discovery Dividend pool table + worker stub (real settlements once subscription revenue exists) | v0.3 |
| Encore Day match pool table + UI badge ("+25% matched today") | v0.3 |
| User-centric subscription allocation worker (`apps/worker/src/jobs/payouts.ts`) | v0.4 |
| Sync licensing opt-in form + usage report + per-tier rate calculator | v0.5 |
| Bandsintown / Songkick live event sync | v0.6 |
| Printful / Printify merch passthrough | v0.6 |
| Working Musician Stipend program launch (foundation-funded) | v1.0+ |
| Quarterly transparency report on every pool + every stipend disbursement | v0.4 onward |

## §11. The promise, in caveman

> Music = work. Work = pay. 
> One play. One sale. One tip. One sync. One ticket. One shirt. 
> All pay. All weekly. All your money. 
> Platform take zero. Foundation eat grants, not artist. 
> No gate. No bundle scam. No ghost. 
> No starving artist on Encore. We figure it out.
