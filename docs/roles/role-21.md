# Role 21 — Recommendations Engine

## Mission
Build a discovery engine that respects listeners. Encore recommendations exist to help people **find music they'll actually love** — not to maximize session length, not to launder paid placements, not to silo people into a single algorithmic taste bubble. The system is **hybrid by design** (collaborative + content + editorial), **explainable** ("we picked this because…"), and **listener-controlled** via algorithm sliders that the user — not a growth team — turns. Defaults are conservative and additive; new artists must be surfaceable from day one.

## Inputs
Schema sources we read from `packages/db/src/schema.ts`:
- **Implicit feedback signals:** `schema.plays` (with `isVerifiedPlay`, `secondsDelivered`, `surface`, `countryCode`), `schema.likes`, `schema.reposts`, `schema.follows`, `schema.playlistItems` (saves count as strong signal).
- **Aggregate counters:** `schema.trackPlayCounters` (`totalPlays`, `totalListeners`, `last7d`, `last30d`) for popularity priors and decay.
- **Content features:** `schema.tracks.embedding` (1024-dim CLAP/OpenL3 audio embeddings), `schema.tracks.loudnessLufs`, `schema.tracks.languageCode`, `schema.tracks.explicit`, `schema.releases.genres` (jsonb), `schema.trackCredits` (producer / writer overlap is a real similarity signal).
- **Editorial state:** `schema.playlists.isEditorial`, `schema.playlists.isPublic`, editor curation rows.
- **User context:** `schema.users.country`, `schema.users.locale`, `schema.users.disableDetailedPlayTracking` (privacy gate — see RFC 004), `schema.subscriptions.tier`.

## Approach
**Three-arm hybrid, blended per request:**
1. **Collaborative filtering (iALS).** Implicit-feedback alternating least squares over the user×track interaction matrix derived from `plays` (verified only, weighted by `secondsDelivered`), `likes`, and `playlistItems` saves. Retrained nightly; user vectors refreshed hourly for active users.
2. **Content-based (pgvector).** Cosine similarity over `tracks.embedding`. Powers "more like this," cold-start for new tracks (no plays yet), and a "vocal/instrumental" slider via embedding sub-projection.
3. **Editorial overrides.** Editor-curated boosts and explicit "fresh out today" surfaces, drawn from playlists where `isEditorial = true`. Editorial slots are inventory-capped (see Role 22) and clearly labeled.

**Cold-start ladder:** new user → genre prompt at signup → seed from `releases.genres` + region-popular (filtered by `users.country`) → first 5 verified plays unlock collaborative arm.

**Algorithm sliders (user-facing, persisted):**
- Familiar ↔ Adventurous (blend weight CF vs content + popularity decay strength)
- Local ↔ Global (geographic prior weight using `users.country` and `artists.location`)
- Vocal ↔ Instrumental (embedding sub-vector projection)
- Established ↔ Emerging (boost for artists with low `trackPlayCounters.totalListeners`)

**On-device option.** For users who set `disableDetailedPlayTracking = true`, we ship a lightweight on-device variant: server returns a candidate pool of ~2,000 embeddings + recent editorial picks; the client re-ranks locally using a private interaction history that never leaves the device.

**Explainability.** Every recommendation row carries a reason code (`because_you_liked`, `similar_sound`, `editor_pick`, `local_artist`, `new_release_followed_artist`).

## What we will NOT do
- **No pay-for-placement.** Artists, labels, or distributors cannot pay to be promoted in recommendations — explicit anti-pattern, modeled directly against Spotify Discovery Mode (royalty trade for algorithmic boost) and Marquee.
- **No engagement-time as the north-star metric.** We do not optimize for time-on-platform or skip-avoidance alone; those metrics reward hostage content.
- **No covert demotion of competitors' tracks** or any catalog-shaping by commercial deal.
- **No behavioral profile sold or shared** with advertisers — see `adCampaigns.targetingJson` is contextual-only by schema design.
- **No "stickiness" dark patterns** like infinite autoplay that ignores explicit user "stop" signals.
- **No silent A/B tests** on the recommendation surface without a public changelog.

## Open Questions
- iALS library choice: `implicit` (Python, batch) vs in-house Rust port for the worker?
- Embedding model: CLAP-LAION vs OpenL3 vs a fine-tuned in-house model on CC-licensed seed corpus?
- Slider UX: discrete 5-point scale or continuous? Defaults per new user?
- Cold-start consent: ask country at signup or infer from CDN edge (privacy trade-off)?
- How aggressive should the "Emerging" boost be before it becomes its own form of bias?
