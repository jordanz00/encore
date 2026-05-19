# RFC 004 — Recommendations

## Status
Draft (pre-1.0). Implementation owners: Role 21 (engine), Role 22 (editorial), Role 23 (radio), Role 24 (new-artist surfacing).

## Context
Encore is built against an explicit anti-pattern set: engagement-time-maximizing recommenders, pay-to-play "Discovery Mode" royalty trades, behavioral profile sale to advertisers, and silent swap-outs of organic playlist tracks for paid placements. We refuse those patterns at the architecture level, not just in policy. Listeners must be able to **see why** something was recommended, **change** how the system behaves via plain-language controls, and **keep** their listening history out of central storage entirely if they want to.

The schema (`packages/db/src/schema.ts`) already encodes the boundaries: `users.disableDetailedPlayTracking` (default `true`), `tracks.embedding` (1024-dim pgvector for content-based recs), `playlists.isEditorial` (transparent editorial state), `adCampaigns.targetingJson` (contextual-only — no behavioral export). This RFC turns those boundaries into a working recommender.

## Decision
Ship a **three-arm hybrid recommender**:

1. **Collaborative filtering — implicit-feedback ALS (iALS).**
   Built nightly over a sparse matrix of (user × track) interactions derived from `schema.plays` (filtered to `isVerifiedPlay = true`, weighted by `secondsDelivered / durationMs`), `schema.likes`, `schema.reposts`, and `schema.playlistItems` saves. Confidence weights: play=1, like=3, repost=4, save=5. Negative implicit signal (started + skipped <10s) penalized at -1. Output: 256-dim user and track factor vectors stored in a serving cache.
2. **Content-based — pgvector cosine over `tracks.embedding`.**
   Embeddings produced by the worker on track ingest using **CLAP-LAION** (primary) with a fallback to **OpenL3**, both 1024-dim, both producing the same column shape. Used for cold-start (new tracks have no plays yet), "more like this," similar-artist station seeding, and the vocal/instrumental slider via embedding sub-projection learned on a curated supervised set.
3. **Editorial overrides.**
   Drawn from playlists where `isEditorial = true` and from a weekly Fresh Crate seed pool (Role 22). Editorial picks have a fixed slot budget per surface — never swap-in/swap-out of organic results.

**Blending.** Per request, the engine blends the three arms via the user's algorithm sliders (familiar↔adventurous, local↔global, vocal↔instrumental, established↔emerging). Default blend: 50% CF, 30% content, 20% editorial. The blend is recomputed per user per day; the resulting candidate set is re-ranked at request time with diversity constraints (max one track per artist per 5 results, language match preference, explicit-content filter).

**Training data.** Verified plays (≥30 s delivered, see `plays.secondsDelivered` and `plays.isVerifiedPlay`), likes, reposts, and saves — only from users **without** `disableDetailedPlayTracking = true`. Users in private mode contribute zero rows to training.

**Cold-start ladder.**
- New user: signup genre prompt → seed from `releases.genres` and region-popular tracks filtered by `users.country`.
- After 1 verified play: content-arm activates (similar-track expansion).
- After 5 verified plays / 3 likes: collaborative arm activates.
- New track: content-arm + emerging-pool guarantee (Role 24 First-100-Plays).
- New artist: same as new track + geographic / genre-room placement.

**Evaluation metrics.**
- **Offline:** recall@10, recall@50, NDCG@10 on a held-out week of verified plays. Coverage metric: % of distinct artists in the catalog that appear in at least one user's top-50 recommendations per week (fairness floor).
- **Online:** A/B tests on **explicit user feedback only** — save rate, follow-through rate to artist page, "thumbs up / thumbs down" on the track row, and a periodic in-app survey ("did this match your taste?"). We do **not** A/B on session length, autoplay-throughs, or skip-avoidance.

**User controls.**
- Algorithm sliders, persisted server-side (or client-side in private mode).
- Per-track feedback: not for me, less like this artist, more like this.
- Editorial-only mode: turn the algorithmic share to 0%.
- Reset taste profile: clears CF user vector and rebuilds from current likes only.

**Privacy boundaries.**
- `disableDetailedPlayTracking = true` (default) → no `plays` rows written, only `trackPlayCounters` increments. CF arm does not learn from these users.
- No behavioral profile export. `adCampaigns.targetingJson` is contextual (genre / mood / time-of-day / language) by schema; this RFC does not loosen that.
- No third-party analytics SDKs in the recommender path.

**On-device variant.**
For private-mode users (and as an opt-in for everyone), the server returns a candidate pool of ~2,000 (track_id, embedding, editorial_flag, popularity_prior) tuples for the listener's region and language, plus the weekly editorial seed. The client re-ranks locally using a private interaction history kept in encrypted device storage. The on-device model is a small re-ranker (logistic regression over hand-built features); embeddings are read-only inputs.

**Server-side variant.**
For users who explicitly opt into detailed tracking, the full hybrid runs server-side with iALS user vectors and rich features.

**Fallback ladder (when subsystems are degraded):**
1. Full hybrid (CF + content + editorial).
2. Content + editorial only (CF cache cold or stale).
3. Editorial + region-popular only (embeddings index degraded).
4. Region-popular only, with a banner: "Recommendations are limited right now."
5. Genre-only browse (Role 24 genre rooms) — never silently fail to a deceptive "for you" surface.

## Alternatives
- **Pure deep-learning two-tower.** Higher ceiling, opaque, training cost high, harder to explain. Rejected for v1; revisit if hybrid plateaus.
- **Pure editorial.** Honest but slow; doesn't scale past hundreds of thousands of listeners.
- **Pure CF.** Cold-start broken; new artists invisible. Forbidden by Role 24.
- **Outsourced recommender (third-party SaaS).** Forbidden — would require shipping listener data off-platform.

## Consequences
- We commit to keeping CLAP/OpenL3 embedding generation in our worker, which adds GPU cost. Acceptable trade.
- We commit to publishing the slider semantics in plain language and updating them with a public changelog whenever weights change.
- We commit to a quarterly fairness report (coverage, new-artist surfacing rate, genre balance).
- We accept that engagement-time will be lower than a pure engagement-optimized stack. That is the point.

## Open Questions
- iALS implementation: Python `implicit` library + nightly batch, or in-house Rust port for the worker?
- CLAP vs. OpenL3 vs. a fine-tuned in-house model on CC-licensed seed audio — which wins on coverage of niche genres?
- Algorithm slider UX: continuous vs. 5-point discrete, with what defaults for new users by region?
- On-device re-ranker: ship as WASM or per-platform native?
- Cooling-off rule for "thumbs down" — how long before a disliked artist can resurface in non-editorial slots?
- Public dashboard for fairness metrics — how granular without exposing individual listener data?
