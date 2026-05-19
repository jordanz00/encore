# Role 24 — New-Artist Surfacing

## Mission
Make sure new artists are **findable on day one** — not after the algorithm has decided they've earned attention by virtue of already having attention. Encore guarantees every uploaded, moderation-approved track gets a **First-100-Plays Guarantee**: a structurally protected pool of impressions in genre rooms, geographic surfaces, and mood lanes before pure-popularity ranking applies. Surfacing is collaborative — listener signals and editor picks both push, neither alone decides.

## Inputs
Schema sources we read from `packages/db/src/schema.ts`:
- `schema.releases.publishedAt`, `schema.releases.status = "published"`, `schema.releases.moderation = "approved"` — eligibility gate for the guarantee.
- `schema.releases.genres` (jsonb) — routes a release into genre rooms.
- `schema.tracks.embedding` (1024-dim) — clusters new tracks into mood / sonic neighborhoods so they show up in "if you like X, try this new Y."
- `schema.tracks.loudnessLufs`, `schema.tracks.languageCode` — secondary routing (language-matched local lanes).
- `schema.artists.location` — geographic surfaces (city / country / nearby).
- `schema.users.country` — regional matching for listeners.
- `schema.trackPlayCounters` — the number we are explicitly trying *not* to over-rely on; used only to detect when the First-100-Plays guarantee has been satisfied.
- `schema.likes`, `schema.reposts`, `schema.follows` — listener "boost" signals that move a track from the guarantee pool into broader rotation.
- `schema.playlists.isEditorial` plus editor activity — editor "boost" signal that elevates a track into Fresh Crate seed (Role 22 / 23).

## Approach
**First-100-Plays Guarantee.** When a track's parent release transitions to `published` and `moderation = "approved"`, the track enters the **emerging pool**. The recommender (Role 21) and stations engine (Role 23) reserve **one slot per 25 station tracks** and **one slot per Fresh Crate** for emerging-pool tracks — until that track has accumulated 100 verified plays in `trackPlayCounters` or 30 days have passed, whichever comes first. After that, it competes on normal ranking.

**Genre rooms.** Lightweight pages keyed off `releases.genres` slugs. Each room has:
- "Just dropped" — last 7 days, sorted by `releases.publishedAt`, capped to one track per artist.
- "Editor picks this week" — Role 22 weekly drop, scoped to the genre.
- "Listeners are saving" — sorted by `likes` + `playlistItems` saves over the last 14 days, *with* the emerging-pool slot reserved.
- "Discover deeper" — content-similar tracks pulled by `tracks.embedding` cosine search, biased toward `trackPlayCounters.totalListeners` low end.

**Geographic discovery.**
- **City / country** lanes seeded from `artists.location` (parsed) and `users.country`. Falls back gracefully when location is missing.
- **Nearby** lane on mobile, optional, opt-in only; uses coarse client-side region (no precise geolocation stored server-side).
- **Diaspora cross-pollination** — listeners in country A whose `users.locale` matches country B see a "from your language community" lane.

**Mood discovery.** Embedding-driven clusters labeled with mood tags by editors (not by the model alone), so the system fails legibly when a cluster doesn't match its label. Mood lanes always include emerging-pool slots.

**Collaborative boosts.**
- **Listener boosts:** `likes`, `reposts`, `follows`, and `playlistItems` saves on emerging-pool tracks count double for the first 30 days.
- **Editor boosts:** an editor adding an emerging-pool track to any `isEditorial` playlist promotes it into Fresh Crate seed pool consideration.
- **Combined signal:** a track with both listener and editor traction in week one gets fast-tracked into Fresh Crate Tuesday.

**Anti-gaming.** Self-plays, self-likes, and same-IP-cluster patterns are filtered via the existing `plays.isVerifiedPlay` and Role 8 fraud heuristics. Coordinated inauthentic boosting routes to moderation review.

## What we will NOT do
- **No "Discovery Mode" tax.** We will not let artists trade royalty rate for algorithmic boost — the Spotify Discovery Mode pattern is forbidden and is the explicit anti-pattern this role exists to refuse.
- **No purely popularity-driven new-artist surfaces.** That just recreates the rich-get-richer dynamic the guarantee is meant to break.
- **No region-locking** of emerging artists out of global lanes — country lane is additive, not exclusive.
- **No "premium upload" tier** that would let some artists skip the queue.
- **No covert demotion of label catalogs** to make room for indies — we add slots, not subtract them.
- **No targeted ad use of new-artist follows** — `adCampaigns.targetingJson` stays contextual-only.

## Open Questions
- 100 plays / 30 days — are those the right thresholds? Per-genre tuning?
- Should the emerging pool be slot-rated by genre health (more reserved slots in over-served genres)?
- Do we expose "First-100-Plays" progress publicly to artists (transparency vs. gaming)?
- City lane granularity — metro vs. country only? Privacy trade-offs.
- How do we surface a new artist's *second* release once their *first* has graduated the pool?
