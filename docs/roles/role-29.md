# Role 29 — Anti-Abuse

## Mission
Defend the play counter, the payout pipeline, the comment surface, and artist accounts from the four ugly classes of attack every music platform inherits: **fake plays** (stream farms, bots, click loops), **bot accounts** (signup fraud, spam, follower padding), **account takeover** (credential stuffing, session theft, payout redirection), and **DMCA / report abuse** (mass false claims, harassment via reporting). Do this **without** building per-listener surveillance (Role 28). We pay for fraud out of money that would otherwise go to artists; preventing it is a payout integrity problem, not just a security problem.

## Policy
- **A play counts only if it's earned.** Minimum **30 seconds delivered** at HLS-segment granularity (Merlin DSR-class equivalent), measured server-side from `plays.secondsDelivered`. `isVerifiedPlay = true` is set only after the threshold is met and basic heuristics pass.
- **Diversity heuristics — no per-user deep profiling.** We score a track's *play stream*, not a listener's identity: rolling-window IP diversity (salted hash), session diversity (`plays.sessionFp`), country diversity (`countryCode`), surface diversity (`surface`), and behavioral entropy (track-skip distributions, inter-play timing). Tracks whose plays come from a narrow cluster are quarantined for review, not the listeners.
- **Bots don't get CAPTCHAs everywhere.** CAPTCHAs (hCaptcha or a privacy-respecting equivalent like Friendly Captcha) appear **only on suspect surfaces**: signup from datacenter IP ranges, password reset, comment posting after rate-limit trip, DMCA / report submission.
- **Account takeover defense.** **Passkeys** are the recommended login method; passwords are second-class citizens. **2FA is mandatory** for any artist account once a payout method is attached — no exception, no grandfathering. Payout-method changes require fresh re-auth + a 72-hour cool-down window with email + in-app notice.
- **DMCA / report abuse.** Per-claimant rate limits (5 notices/day baseline, raised on verified label / agent status). Mass-identical notices land in a review queue rather than auto-action. Three sustained false claims in 90 days → claimant blocked from the form.

## Implementation pointers
- **Schema:** `plays` (`sessionFp`, `secondsDelivered`, `isVerifiedPlay`, `surface`, `countryCode`, `playedAt`); `userSessions.tokenHash`, `userSessions.ipHash` (salted, daily-rotating salt); `userCredentials.passkeysJson`, `userCredentials.totpSecret`. The existing `plays` index `plays_track_idx (trackId, playedAt)` powers windowed entropy queries. See `packages/db/src/schema.ts`.
- **Routes:** `apps/api/src/routes/plays.ts` is the validation chokepoint — enforces 30s threshold, increments `trackPlayCounters` only on verified plays, writes `plays` only for opted-in users. `apps/api/src/routes/auth.ts` owns 2FA enforcement, passkey registration, and the payout-change cool-down. `apps/api/src/routes/legal.ts` (Role 26) enforces DMCA-claimant rate limits.
- **Worker job** (in `apps/worker/`, future) recomputes per-track entropy nightly and flags candidates into the moderation queue; payouts hold suspect tracks until release.
- **No per-listener risk score is persisted.** Heuristics produce a *track* quarantine flag, not a `users.fraudScore` column.

## Process
1. Continuous: server-side play validation on every HLS segment delivery.
2. Hourly: rolling-window entropy job; surface anomalies into moderation queue.
3. Pre-payout: all candidate plays for the period are re-validated; quarantined tracks held for human review (Role 27 owns the review surface).
4. Monthly: payout-fraud retro — what got through, what was wrongly held — fed back into thresholds.
5. Quarterly: anti-abuse stats in the transparency report (no PII).

## Open Questions
- Datacenter / VPN IP detection: which list (IPinfo, MaxMind, open-source `iptoasn`) and how often refreshed?
- Do we publish the verified-play threshold (30s) in the artist FAQ — risk gaming, but the alternative is opacity that erodes trust?
- Should embedded-player plays on third-party sites count toward payout, or only toward marketing analytics?
- 2FA for listener accounts — strong nudge with fallback codes, or hard requirement after first payment method on file (subscriptions)?
