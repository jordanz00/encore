# Role 01 — Spotify Deep Audit

## Mission
Reverse-engineer what Spotify does well, what Spotify does badly, and what is actively hostile to artists and listeners — so Encore can copy the table-stakes UX, ignore the dark patterns, and price/pay artists honestly. This role owns competitive intelligence on the dominant DSP and feeds findings back into product, recs (`docs/rfcs/004-recommendations.md`), payouts (`packages/db/src/schema.ts` → `payouts`, `plays`), and editorial (`packages/db/src/schema.ts` → `playlists.isEditorial`).

## Keep
- **Editorially curated playlists** (Today's Top Hits / RapCaviar / Lorem) as a discovery surface alongside algorithmic mixes. Editorial badges already exist on our schema (`playlists.isEditorial`).
- **Daily Mix / Discover Weekly / Release Radar pattern** — recurring, dated, low-stakes algorithmic playlists that decay are a genuinely good UX. Maps to the radio + content-based recs we have stubbed in `apps/api/src/routes/recommendations.ts` and the embedding column on `tracks` in `packages/db/src/schema.ts`.
- **Wrapped-style year-in-review** as an annual reciprocal moment. Listeners get a personal artifact, artists get a shareable summary of their year. Aggregate counters in `track_play_counters` plus full play rows already support both sides without surveillance.
- **Cross-device handoff & Connect-style remote control** — push playback from phone to desktop / cast target. Maps to Role 16 / Role 19 work and the `surface` column on `plays`.
- **Podcast unification** in the same player as music. Already first-class in `packages/db/src/schema.ts` (`podcastFeeds`, `podcastEpisodes`) and `apps/api/src/routes/ingest-podcasts.ts`.
- **Aggressive prefetch + gapless** for perceived performance.

## Drop
- **Per-stream pooled royalties** that pay fractions of a cent and reward catalog consolidation over independents.
- **Demonetisation thresholds** (the "1,000 streams in 12 months" floor, payola-adjacent Discovery Mode trade-of-reach-for-lower-royalty). Encore's payout model in `payouts` should never reduce a per-play rate in exchange for placement.
- **Forced shuffle / can't-skip** patterns on the free tier. Free tier should be honest and skippable.
- **Behavioural ad targeting** built on listening surveillance. Our schema deliberately lacks behavioural targeting columns; `adCampaigns.targetingJson` is contextual (genre / mood / time / language) only.
- **Dark-pattern downgrade flows** (multi-step cancel, "are you sure" interstitials).
- **Hidden artist tools** — Spotify for Artists is a separate property with separate auth. Encore artists should manage release, pricing, and analytics from the same account they listen on (`users.role = 'artist'`).
- **Algorithmic ghost artists / library padding** with sound-alike commissioned content.

## Recommendations for Encore
1. **Honest payouts.** Sales (`sales`, near-100% to artist minus processor fee), tips, and streaming each get their own line in `payouts` (already modelled). Publish per-period transparency reports per artist; never net-negative an artist via "promotion" deals.
2. **Recs without surveillance.** Lean on the audio embedding (`tracks.embedding`, 1024-dim, see `docs/rfcs/004-recommendations.md`) plus opt-in collaborative signals. Respect `users.disableDetailedPlayTracking` (default `true`) — those listeners get content-based recs only.
3. **Daily Mix / Release Radar equivalents** as named, dated playlists owned by an "Encore Editorial" system actor; refreshed by `apps/worker/` jobs.
4. **Year in Encore** computed from `track_play_counters` and aggregate-only data when detailed tracking is off.
5. **Free tier with dignity:** ad-supported (contextual via `adCampaigns`) but no skip limit, no shuffle lock, no audio-quality penalty below 96 kbps.
6. **One identity, two hats.** Artist tools live in the same web app at `apps/web/` behind the `artist` role; no separate portal.

## Open Questions
- Do we offer a Spotify-style "Blend" (shared taste mix between two users) v1 or v2? Privacy implications under `disableDetailedPlayTracking`.
- Editorial scale: how large an editorial team can a Merlin-onboarded indie platform realistically run before it becomes a payola surface?
- Wrapped clones are now table stakes — do we differentiate (e.g., "Year in Encore" with sales / tips / live attended), or stay deliberately quiet to avoid the same gamification trap?
- Podcast monetisation: dynamic ad insertion is the Spotify play, but it breaks RSS portability. We probably stay RSS-pure and let hosts monetise upstream — confirm.
