# Role 23 — Radio, Stations, and Fresh Crate

## Mission
Give listeners the lean-back experience without the engagement-bait baggage. Encore ships a **weekly personalized 50-track "Fresh Crate"** (our Discover-Weekly equivalent), **genre / mood stations**, **artist radio**, and **daily mixes** — all with the same rules: the user can see why a track was chosen, can lean toward more new artists, can swap to a fully editorial-only mode, and can opt out of behavioral storage entirely. Radio is a service, not a slot machine.

## Inputs
Schema sources we read from `packages/db/src/schema.ts`:
- `schema.plays` (verified plays only via `isVerifiedPlay`, weighted by `secondsDelivered`), filtered by `disableDetailedPlayTracking` flag on the user.
- `schema.likes`, `schema.reposts`, `schema.follows` — strong positive signals.
- `schema.playlistItems` saves into the listener's own playlists — strongest "I want this again" signal.
- `schema.tracks.embedding` (1024-dim CLAP/OpenL3) for content-similarity walks.
- `schema.tracks.loudnessLufs`, `schema.tracks.languageCode`, `schema.tracks.explicit` — used as constraints, not ranking features (loudness for normalization, language for "more like this in my language" preference, explicit for the explicit-content toggle).
- `schema.releases.genres`, `schema.releases.publishedAt` — freshness gating.
- `schema.trackPlayCounters.totalListeners` — used to identify "emerging artist" candidates.
- `schema.playlists` with `isEditorial = true` — Fresh Crate seed pool ships from here weekly (see Role 22).
- `schema.users.country`, `schema.users.locale` — local lane and language preference.

## Approach
**Fresh Crate (weekly, 50 tracks, ships Monday 06:00 local).**
- 60% personalized via the hybrid recommender (Role 21 / RFC 004): collaborative-filtering seeds rescored against the listener's recent `plays` and `likes`, with `tracks.embedding` cosine-walked for "near taste" expansion.
- 25% **editorial Fresh Crate seed pool** — the curated drop from the weekly editorial ritual (Role 22).
- 15% **explicit "more new artists" lane** — boosted when the user has set the `New artists ↑` preference, capped at one new artist per 4 tracks otherwise.
- Listeners always get a **regenerate** button (one regen per week) and a **"Save before it rotates"** action that copies the playlist into a personal `schema.playlists` row before next Monday.

**Stations.** Lightweight, infinite-but-not-deceptive:
- **Genre / mood stations** seeded from `releases.genres` and editorial mood tags; ranked by content similarity (pgvector) plus a popularity floor.
- **Artist radio** seeded from a chosen artist's tracks; expands via shared `trackCredits` (producer / writer overlap), shared `releases.genres`, and embedding similarity — not just "people who listened to X also listened to Y," which collapses into the same five major-label artists.
- **Daily mixes** generated nightly from clusters of the listener's saved tracks (k-means in embedding space, 4–6 mixes per active listener).

**Listener controls (per user, persisted; default values in parentheses):**
- More new artists ↔ familiar voices (balanced)
- Vocal ↔ instrumental (balanced)
- Local ↔ global (slight local lean by `users.country`)
- Explicit allowed (off by default for under-18 / region-rated)
- Editorial-only mode (off by default; turns the algorithmic share to 0% for the user)

**Explainability.** Each radio item exposes a "why this?" sheet: similar to {seed track}, picked by editor {name}, popular in {region}, new release from artist you follow.

**Privacy boundary.** When `disableDetailedPlayTracking = true`, server stops writing per-row `plays`, the recommender shifts to the on-device variant (RFC 004), and Fresh Crate computes from a candidate pool delivered to the client.

## What we will NOT do
- **No "engagement time" optimization.** We do not rank to maximize session length, autoplay-throughs, or skip-avoidance.
- **No infinite autoplay that ignores stop signals.** Stations end after 100 tracks unless the user extends; long sessions trigger a "still listening?" check.
- **No paid station seeding.** A label cannot pay to seed any station with their roster.
- **No anonymous "personalized for you" without a stated reason.** Every track shows a "why."
- **No swap-out of saved Fresh Crate tracks** after the user saves the playlist — once saved, it's immutable except by the listener.
- **No cross-product behavioral profile** — radio signals stay inside the recommender; they are not exported to ad targeting (`adCampaigns.targetingJson` is contextual-only).

## Open Questions
- One Fresh Crate per week, or also a "Fresh Crate Sunday" (slower, deeper cuts)?
- Should listeners see *which* editor's pick filled the editorial 25% of their Fresh Crate?
- Do we cap "more new artists" at a hard floor of `trackPlayCounters.totalListeners < N`?
- Stations on free tier: skip limits or full skips (decision lives in Role 7 monetization)?
- How do we expose listener-curated "big playlists" alongside editorial radio without confusing the surface?
