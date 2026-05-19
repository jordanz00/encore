# Role 28 — Privacy + Data Minimization

## Mission
Treat listener data the way a good library treats borrowing records: collect the minimum needed to run the service, keep it for the shortest time that's useful, never sell it, never share it without a court order, and let people walk away with a clean copy of what we held. Comply with **GDPR** (EU/UK), **CCPA/CPRA** (California), **PIPL** (China — to the extent we operate there), and **PIPEDA** (Canada). Treat U.S. users at GDPR levels by default — it's cheaper than running two policies and it's the right standard.

## Policy
- **Per-listen tracking is OFF by default.** New accounts get `users.disableDetailedPlayTracking = true`. No `plays` row is written; only the aggregate `trackPlayCounters` (`totalPlays`, `totalListeners`, `last7d`, `last30d`) is incremented. The listener can opt **in** to detailed history for personal "year-in-review" / "recently played" features at any time, and opt back out with one click.
- **Aggregate-only counters are the default truth.** Artists' play numbers come from `trackPlayCounters`. The fine-grained `plays` table exists for the opt-in subset, fraud detection (Role 29), and DSR-class payout accounting — never for ad targeting or recommendation profiling at the individual level.
- **No third-party trackers.** No Google Analytics, no Facebook Pixel, no Segment, no Mixpanel, no Hotjar, no anything that ships an identifier off our infra. First-party analytics only, in a Plausible-style cookieless model: page-level events with no per-user IDs and no per-IP storage beyond the salted, daily-rotating hash needed to deduplicate visits.
- **No cookie banner unless a cookie demands one.** If we don't drop non-essential cookies, we don't beg for consent. Essential cookies (session, CSRF, theme) get a one-line privacy notice in the footer; that's it.
- **Data export.** Every account can download a ZIP of their data — profile, follows, likes, playlists, comments, opt-in play history, sales, payouts — in **JSON + CSV**, generated within 24 hours of request, expires in 7 days.
- **Data deletion.** "Delete my account" performs a real delete: soft-delete on `users` + cascade null on identifying foreign keys, hard-purge of `userCredentials`, `userSessions`, opt-in `plays`, and personal media. Aggregate counters and pseudonymized financial records (sales, payouts — needed for tax / accounting) are retained per legal minimum and de-linked from the user.
- **No data sale.** Ever. Codified in the privacy policy and the Terms; CCPA "Do Not Sell" is a no-op because the answer is already no.

## Implementation pointers
- **Schema:** `users.disableDetailedPlayTracking` (default `true`); `trackPlayCounters` for aggregates; `plays` row written only when `disableDetailedPlayTracking = false` AND `secondsDelivered >= 30` AND `isVerifiedPlay = true`. `userSessions.ipHash` is salt-rotated, never raw IP. See `packages/db/src/schema.ts`.
- **Routes:** `apps/api/src/routes/plays.ts` is the chokepoint — must consult the user flag before persisting; `apps/api/src/routes/auth.ts` enforces the default on signup and exposes `POST /auth/me/privacy/export` and `POST /auth/me/privacy/delete`.
- **Analytics:** self-hosted Plausible or equivalent at `analytics.encore.local`; no client-side script that beacons elsewhere.
- **Logs:** request logs capture path + status + latency; **never** payload, query string, or full IP. Retention: 30 days.

## Process
1. Privacy review on every PR that touches a route writing to `users`, `userSessions`, or `plays`.
2. Annual data-minimization audit by a council member outside the engineering owner of that surface.
3. Public DPIA published for any new data category (e.g. if we ever add voice search).
4. DPO contact in `SECURITY.md` and the privacy page.

## Open Questions
- Tax-jurisdiction record retention for payouts — minimum window per country (US 7y, EU varies)?
- Federated context: how do we honor an export request that includes data we've replicated from a remote ActivityPub server (we own the cache; they own the source)?
- Should "recently played" exist at all in v1, or do we ship the privacy default and add the opt-in feature later?
