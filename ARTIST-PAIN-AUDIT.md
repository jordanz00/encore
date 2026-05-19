# Artist Pain Audit — What Artists Hate About Current Platforms, and How Encore Fixes Each

> Every complaint in this document is sourced from a 2024–2026 news article, lawsuit, congressional bill, or first-person artist statement — all cited at the bottom. This is the design contract: each fix is a non-negotiable invariant for Encore.

## The 16 active grievances (mapped to Encore fixes)

### Group A — Money

| # | Artist grievance | Where it comes from | Encore fix |
|---|---|---|---|
| 1 | **Spotify reclassified Premium as a "bundle" with audiobooks in March 2024**, cutting songwriter mechanical royalties by an estimated **$150M in 12 months** and a further **30–40% drop in January 2025**. Music-only plans are <1% of US subscriptions. | MLC federal lawsuit (May 2024); NMPA FTC complaint (Jun 2024); *Billboard*, *Digital Music News*, *Time* | Encore ships no bundles that mix recording royalties with non-music products. Subscription revenue is split cleanly between recording-side (artist/label) and publishing-side (songwriter) via the user-centric pool; **no bundle discount can be applied to mechanical royalties.** Documented as a schema-level invariant: `subscriptions.tier` cannot reference non-music goods. |
| 2 | **Spotify pays $0.003 per stream**; an artist needs >800,000 monthly streams to clear a $15/hr full-time job. 87% of tracks earn $0 (under the 1,000-stream gate). | *Music Ally* (Aug 2025); Tlaib Living Wage for Musicians Act; UMAW data | **0% platform fee on direct sales** (vs Bandcamp's 10–15%). **No 1,000-stream cliff**: every verified 30-second play earns. User-centric subscription pool: your $9.99 → only the artists you played, not a global dilution pot. Detailed examples in [`ARTIST-ECONOMICS.md`](ARTIST-ECONOMICS.md). |
| 3 | **Spotify Discovery Mode = "modern payola"** (Manhattan class action, late 2024): artists trade a per-stream rate cut for algorithmic boost — visibility for sale. | *Rolling Stone* class-action coverage | Encore ships no "pay for algorithmic boost" tier ever. Anti-success commitment encoded in [`ROADMAP.md`](ROADMAP.md) "Things we will not build". Editorial placements must show a disclosure badge if they were sponsored — see Anti-Pattern Rule §1 below. |
| 4 | **Songtradr cut Bandcamp's staff by ~50%** in October 2023, including the entire Bandcamp United union organizing committee and half the editorial team. Songtradr promised continuity; the cuts contradicted that promise. | *The Verge*, *FADER*, *48 Hills*, *WIRED*, *Billboard Canada* | Encore is structurally un-acquirable: AGPL-3.0 (no closed fork), governance progresses to a non-profit foundation, no investor equity to sell. See [`GOVERNANCE.md`](GOVERNANCE.md) + `PLATFORM-SUCCESS-STRATEGY.md` §3. |
| 5 | **Ek's $1B investment in Helsing (military AI drones)** triggered the largest indie exodus from Spotify in the platform's history starting June 2025: Deerhoof, King Gizzard, Massive Attack, Godspeed You! Black Emperor, Xiu Xiu, Hotline TNT, ~70 Chicago musicians. Reason cited verbatim: *"We don't want our music killing people."* | *KQED*, *Mashable*, *Exclaim!*, *WBEZ Chicago*, *The Conversation* | Encore cannot be exposed to founder-equity-funded weapons investments because there are no founder equity holders — the project is foundation-owned. ToS prohibits the platform's reserves from being invested in weapons, fossil fuel extraction, surveillance technology, or speculative crypto. |

### Group B — Catalog and discovery integrity

| # | Artist grievance | Source | Encore fix |
|---|---|---|---|
| 6 | **"Perfect Fit Content" / ghost artists**: ~20 commissioned songwriters generate music distributed across 500+ fake artist profiles to dilute royalty payouts on Spotify's biggest mood playlists (Deep Focus 4.5M+ subscribers, Ambient Relaxation, Cocktail Jazz, Bossa Nova Dinner). Editors who resisted were sidelined. | Liz Pelly, *Harper's* "The Ghosts in the Machine" (Jan 2025); *The FADER*, *NME* | Encore editorial playlists must (a) disclose every track's actual rightsholder, (b) prohibit any editor or curator from also being an undisclosed artist on the playlist, (c) prohibit Encore from commissioning music for its own playlists. Schema commitment: `playlist_items` already has `addedByUserId`; we add a `conflictDisclosure` column in v0.6. |
| 7 | **AI-generated music flooding platforms** with no label disclosure. Indie artists report their authentic work buried under AI slop. | *WBEZ Chicago* (Sept 2025) | Encore ToS requires AI-generated tracks to declare AI usage at upload. UI flag is visible on the player. Recommendations engine de-prioritizes undeclared-AI tracks when detected. Not a Luddite stance — AI-assisted tracks are welcome — but disclosure is required for listener trust. |
| 8 | **Algorithm-driven model relies on heavy user data collection** that indie artists oppose as a matter of principle (privacy, consent). | *WBEZ Chicago* (Sept 2025) | Detailed play tracking is **off by default** (`users.disableDetailedPlayTracking = true`). Aggregate counters only. Schema-enforced: `ad_campaigns.targetingJson` cannot reference `userId` or `cohortId`. |
| 9 | **Algorithm + editorial opacity**: artists have no insight into why their music is or is not surfaced. | UMAW position paper; consistent across artist interviews | Algorithm sliders ship as a user control AND an artist-side analytics page that shows: (a) what slider weights drove discovery to your tracks last 30 days, (b) which editorial playlists added/removed you and when, (c) which radio stations surfaced you. |

### Group C — Process, payouts, and UX

| # | Artist grievance | Source | Encore fix |
|---|---|---|---|
| 10 | **Bandcamp pays via PayPal only**, which excludes a large share of artists in Argentina, Pakistan, Nigeria, etc. SoundCloud Artist Pro charged trial users without warning and had unresponsive support. | David Whiting LinkedIn post (Jan 2025); Bandcamp Help Center | Encore pays via Stripe Connect Express, Wise, local mobile money (M-Pesa, MoMo, Orange Money), UPI (India), Pix (Brazil), and Lightning. See [`GLOBAL-LAUNCH-PLAYBOOK.md`](GLOBAL-LAUNCH-PLAYBOOK.md). Trial flows: any auto-charging trial requires explicit second-step confirmation; cancellation is one click. |
| 11 | **No direct listener-to-artist financial relationship.** Streaming hides who paid for what. | UMAW; *The Conversation* (2025); recurring complaint across exodus statements | User-centric payouts make the relationship explicit. Artist statements show: *"Listener `@handle` (or anonymous if hidden) contributed $X.XX to your payout this period through subscription / tipping / direct sale."* No public fan-doxxing — listeners control whether their handle appears. |
| 12 | **Multi-tool fatigue**: working artists juggle Bandcamp + Patreon + Songtradr + DistroKid + SoundCloud + Linktree + a CRM + email list + analytics dashboards. Each platform owns part of their business; none of them connect. | Chartlex 2026 series; first-person artist threads on Hacker News, Threads, Mastodon | Encore is a single dashboard for direct sales, streaming, tipping, fan list, analytics, distribution to other DSPs (via the DDEX pipeline run in reverse), sync inquiries, and email broadcast. The pitch sentence: *"Upload once, sell direct, stream everywhere, federate to the fediverse, keep the receipts."* |
| 13 | **Catalog hostage**: artists cannot easily leave a platform with their data intact. Fan lists, sales receipts, comments, plays, releases are scattered or locked. | Artists who left Bandcamp post-Songtradr; *WIRED* coverage | Right-to-Export is a permanent ToS clause: one-click ZIP includes audio masters, metadata, sales receipts CSV (per buyer), fan email list, all comments, federation actor key, podcast feeds. No "Leave a Legacy" extortion (DistroKid's term for charging artists to keep their music live after cancellation). |
| 14 | **Customer service collapse**: support response times measured in weeks or months at incumbents. | David Whiting (SoundCloud); various Bandcamp post-layoff threads | Encore support is funded through the foundation, not optimized away by acquirers. SLA targets in v1.0: payment / payout / refund queries respond within 48h; takedown / DMCA queries within 24h; general support within 7 days. Published response-time dashboard. |

### Group D — Songwriter-specific pain (the hidden grievance)

| # | Songwriter grievance | Source | Encore fix |
|---|---|---|---|
| 15 | **Songwriters are paid an order of magnitude less than recording artists** for the same stream, by design of US Copyright Royalty Board structure. Spotify's bundle reclassification compounded this. | Tlaib Living Wage Act explainer; MLC suit | Encore's user-centric pool splits subscription revenue 50/50 between recording-side and publishing-side payouts. Artists who self-write (most indies) keep both halves. Co-writers and publishers receive direct splits via the song's `tracks.iswc` + a separate `song_credits` table linking songwriters with split percentages. |
| 16 | **No direct songwriter dashboard**: songwriters can only see their income via their publisher's quarterly statement, with no per-track real-time visibility. | NMPA position; songwriter trade press | Encore ships a Songwriter Dashboard that shows: per-track mechanical royalty earnings, per-territory breakdown, ISWC, co-writer splits, publisher routing, year-to-date statement, tax-ready export. Songwriters can be linked to one or more publishers and route their share automatically. |

## Anti-pattern rules — hard product commitments

To make the fixes above enforceable, eight anti-pattern rules live in the engineering review checklist. Any PR violating them is closed without merge.

1. **Disclosure over editorial integrity.** No editorial placement is unmarked if it was paid, owned, or commissioned by the platform.
2. **No pay-to-prioritize.** No artist can buy higher placement in algorithmic recommendations or editorial. Period.
3. **No silent threshold.** No track is silenced from earning by a stream-count minimum.
4. **No retroactive royalty cuts.** Royalty terms can only change going forward and require 90 days advance notice in writing to every affected artist.
5. **No platform-owned ghost catalog.** Encore, the foundation, and any affiliated entity may not commission, own, or distribute music profiles on the platform.
6. **No behavioral ad targeting.** Schema-enforced: targeting fields cannot include `userId`, `cohortId`, listening history, or device fingerprint.
7. **Right-to-Export.** One-click full ZIP export including audio masters, sales receipts, fan list, comments, federation key — a permanent ToS right.
8. **No bundle discount on mechanical royalties.** Subscription pricing cannot be averaged with non-music products to lower the publishing-side payout.

## What this looks like in code

| Anti-pattern rule | Where it is enforced |
|---|---|
| #1 Disclosure | `playlist_items.sponsorshipDisclosure` (v0.6); admin UI requires it before publish |
| #2 No pay-to-prioritize | No `boost_credits` or `promotion_tier` columns exist in `packages/db/src/schema.ts` and no PR may add them without changing this doc first |
| #3 No silent threshold | `apps/worker/src/jobs/payouts.ts` (v0.4) computes payouts from `plays.is_verified_play = true`; no `HAVING` clause on stream count |
| #4 No retroactive cuts | `tos_versions` table tracks effective-date; payout engine pulls the version active at play time |
| #5 No ghost catalog | Foundation bylaws clause + monthly automated audit query: artists with `ownerUserId IN (foundation_employee_ids)` flagged for review |
| #6 No behavioral ad targeting | Schema-level: `ad_campaigns.targetingJson` JSON schema validator rejects user-level fields |
| #7 Right-to-Export | `apps/api/src/routes/exports.ts` (v0.4); always available, no paywall |
| #8 No mechanical bundle discount | `subscriptions.tier` enum cannot include non-music products without a schema migration that flips this doc to allow it |

## What artists are organizing for — and how Encore ladders into it

The **Living Wage for Musicians Act** (Tlaib, Sept 2025) proposes an Artist Compensation Royalty Fund: ~50% subscription surcharge + 10% non-subscription levy, capped at 1M streams per track per month to favor mid-tail artists. NYC Council passed a supporting resolution in May 2025.

Encore supports the act publicly and aligns its subscription pool design with the Act's principles:

- **Stream cap on payout**: the user-centric pool already prevents megastar dominance by listener, but we add a per-track per-month cap to mirror the Living Wage Act's structure. Excess flows back to the artist pool, weighted toward smaller artists.
- **Direct distribution**: payouts are paid directly to artists (and split to songwriters via `song_credits`) without label intermediation by default.
- **Transparent**: every artist statement shows the exact formula that produced their payout.

If the Act passes, Encore becomes a compliance-ready DSP day one — and a model for how the math should work.

## Citations

- *Bloomberg* (Jun 2024): Spotify FTC complaint by songwriters association.
- *Billboard* (Mar 2024): "Spotify to Pay Songwriters Less Royalties Next Year Due to Book Bundle."
- *Digital Music News* (Jan 23 2025): "Spotify Mechanical Royalties Just Dropped 30-40%, Publishers Say."
- *Time* (2024): MLC lawsuit ($150M estimate).
- Liz Pelly, *Harper's* (Jan 2025): "The Ghosts in the Machine."
- *The FADER*, *NME* (Dec 2024): Perfect Fit Content reporting.
- *Rolling Stone* (2024): Discovery Mode payola class action.
- *KQED* (2025): Musicians leaving Spotify over CEO defense investments.
- *Mashable* (2025): Why artists are leaving Spotify.
- *Exclaim!* (2025): Deerhoof / Jay Arner interview on Spotify exodus.
- *WBEZ Chicago* (Sept 25 2025): 70 Chicago musicians leaving over AI + data privacy.
- *The Conversation* (2025): Indie exodus analysis.
- *The Verge*, *FADER*, *48 Hills*, *WIRED*, *Billboard Canada* (Oct 2023): Bandcamp / Songtradr layoffs and union organizer terminations.
- David Whiting LinkedIn post (Jan 2025): SoundCloud Artist Pro billing complaint.
- SoundCloud Help Center: Fan-Powered Royalties.
- *Billboard*, *EDM.com* (2025): SoundCloud 100% distribution + Fan Support tipping launch.
- UMAW: "Make Streaming Pay" campaign.
- *Music Ally* (Aug 19 2025): Living Wage for Musicians Act reintroduction.
- CDM Create Digital Music: Living Wage Act second push.
- Rep. Tlaib (Sept 29 2025): bill reintroduction announcement.
- *Digital Music News* (May 28 2025): NYC Council resolution.
