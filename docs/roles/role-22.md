# Role 22 — Editorial Workflow

## Mission
Run an editorial program that listeners and artists can **trust**. Encore editorial is human-curated, transparent about who picked what, and structurally insulated from commercial pressure. Every editorial placement is a stated point of view by a named editor or community curator — not an unsigned algorithm output, and never a paid slot. Editorial sits beside the algorithm, not above or below it; both surfaces are clearly labeled.

## Inputs
Schema sources we read and write from `packages/db/src/schema.ts`:
- `schema.playlists` with `isEditorial = true` and `ownerUserId` pointing at an editor account (`users.role = "editor"`).
- `schema.playlistItems` — every item has `addedByUserId` and an optional `note` (editor's one-line "why this track").
- `schema.releases.publishedAt`, `schema.releases.genres`, `schema.releases.credits` (used to detect conflict-of-interest: an editor with credits on a track cannot promote it).
- `schema.trackCredits` (artistId / role) — same conflict check at the track level.
- `schema.artists.location`, `schema.artists.verified` — used for "local scene" features and to resist impersonation in community curator applications.
- `schema.trackPlayCounters` — used as one input for the "fresh / overlooked" review, never as the deciding factor.
- `schema.moderationReports` — editors triage flagged content the same as moderators where overlap exists (Role 19 owns moderation tooling).

## Approach
**Two-track curator pool.**
- **In-house editors** — small paid team, regional + genre desks (e.g. NA-Hip-Hop, EU-Electronic, LATAM-Pop, Global-Jazz, Classical, Folk, Experimental). Identified publicly with name + bio.
- **Community curators** — applications-based, rotating tenure (default 6 months, renewable). Receive a verified-curator badge while active and a permanent attribution on archived playlists.

**Slot inventory.** `/discover` and `/editorial` have a fixed, audited number of slots per surface (e.g. Discover hero = 1, "Fresh Crate" promo = 1, Genre lanes = 6, Regional lane = 1). Slot counts are published in `docs/editorial/slot-inventory.md`. Increasing slot count requires a public RFC.

**Weekly Fresh Crate ritual.** Every Tuesday: editors meet, review new releases by `releases.publishedAt` in the prior 7 days plus community-curator submissions, debate, vote, and ship the personalized Fresh Crate seed pool by Wednesday morning UTC (Role 23 builds the per-user list from that pool). Notes from the meeting are public on `/editorial/notes`.

**Conflict-of-interest gate.** A server-side check blocks an editor from adding a track to an editorial playlist if:
- They appear in `schema.trackCredits` for that track, OR
- They appear in `schema.releaseArtists` for the parent release, OR
- They have `schema.follows` to the artist *and* are in their first 90 days as an editor (cooling-off period).
Conflicts are recorded; another editor must do the placement and sign off.

**Rotation & freshness.** Editorial playlists rotate at least monthly. Stale items (no listener saves, no plays-from-this-playlist after 14 days) get reviewed at the weekly meeting. No editor can keep a single track in a hero slot more than 14 days without a co-signer.

**Transparency surfaces.**
- Every editorial track row shows: editor name, region desk, "why" note from `playlistItems.note`, and date added.
- Public quarterly editorial report: counts by genre, region, gender, and label-size buckets (independent / mid / major) so the community can audit balance.

## What we will NOT do
- **No paid placement.** Labels, distributors, and advertisers cannot pay or trade for editorial slots. This is the structural difference from Spotify's Discovery Mode and Marquee.
- **No anonymous editorial.** Every placement is attributable to a human editor.
- **No silent A/B tests** on editorial surfaces — editorial is a stated point of view, not a swappable variant.
- **No editor self-promotion** of tracks where they are credited — enforced in code, not just policy.
- **No replacing editorial picks with algorithmic ones** mid-week to chase engagement; editorial is editorial until the next planned rotation.
- **No infinite scroll on `/editorial`** — respect the slot inventory.

## Open Questions
- Compensation model for community curators (revenue share? flat stipend? listener tips?).
- How do we measure editorial "success" without falling back into engagement-time metrics? Saves-per-placement, follow-throughs to artist page, listener-reported satisfaction surveys?
- Translation pipeline for editor "why" notes across locales.
- How do we handle editorial disagreement publicly — dissent notes? Counter-playlists?
- What's the cooling-off period when an editor leaves the team and rejoins?
