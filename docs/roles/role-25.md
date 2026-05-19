# Role 25 — Playlists Strategy

## Mission
Treat playlists as **listener-owned creative work**, not as advertising real estate. Encore supports collaborative multi-user playlists, queue sharing, listener-curated "big playlists" with an editor verification badge, and a strict ban on swapping out organic tracks for paid placements. A listener who builds a 1,000-track playlist is a curator; we protect that work.

## Inputs
Schema sources we read and write from `packages/db/src/schema.ts`:
- `schema.playlists` — `ownerUserId`, `isPublic`, `isCollaborative`, `isEditorial`, `coverKey`, `description`.
- `schema.playlistItems` — `playlistId`, `trackId`, `position`, `addedByUserId`, `addedAt`, `note` (the per-item "why" line).
- `schema.tracks` (id, title, primaryArtistId) and `schema.releases` for the parent release / genre context.
- `schema.users.role` (so editors can stamp verification on community-built playlists without taking ownership).
- `schema.follows`, `schema.likes`, `schema.reposts` — social signal on playlists themselves (followers, save count) feed Role 23 station seeding when the owner opts in.
- `schema.moderationReports` — playlists are reportable; abusive collaborative permissions or hate-tagged playlists route through Role 19 moderation.

## Approach
**Personal playlists.** Default-public, owner-only edits. Cover art uploaded or auto-generated from `tracks.embedding` clustering. Description and per-item `note` fields are first-class so curators can show *why* a track is on the list — that's what makes a great playlist great.

**Collaborative playlists.** When `playlists.isCollaborative = true`, additional users can be invited as editors. Every `playlistItems` row records `addedByUserId`, so attribution is permanent: you can always see who added what. Owner can:
- Invite by handle, link, or scoped link (view-only / contributor / co-owner).
- Set rules: max additions per contributor per week, allowed genres, explicit on/off.
- Approve-before-add mode for high-traffic collaborative lists.
- Audit log of every add / remove / reorder, surfaced in the playlist's history tab.

**Queue sharing.** A listener can broadcast their currently playing queue to a session link. Joiners receive the queue snapshot + live updates; the host keeps full control (skip, add, reorder). No persistent surveillance — the session evaporates when the host ends it.

**Listener-curated big playlists + editor verification badge.**
- Any listener can build a public playlist of any size.
- When a listener-curated playlist crosses a threshold (e.g. ≥100 tracks, ≥500 followers, no moderation flags in 90 days), it becomes eligible for an **editor-verified badge**.
- An editor (Role 22) reviews for accuracy of attribution, absence of self-dealing (curator not stuffing their own credits), and basic editorial coherence. Verified badge is **on the badge**, not on the playlist's surface — we do not convert listener playlists into editorial ones. The owner stays the owner.

**Discovery of playlists.** Playlists surface in:
- Search (by title / description / contributor handle).
- "People who saved {track} also saved these playlists" via `playlistItems` co-occurrence.
- Editorial roundups of community playlists (Role 22 weekly ritual highlights notable listener playlists with curator credit).

**Federation.** A public playlist (especially a verified one) can publish as an ActivityPub object so other fediverse music platforms can subscribe / mirror — see RFC 005 for federation specifics.

## What we will NOT do
- **No algorithmic swap-out of saved playlists.** Once a listener saves a playlist, the platform never silently replaces tracks in it. A track removed by takedown is shown as "no longer available," with a link to a replacement only the *listener* can accept. This is the explicit anti-pattern: Spotify-style swap-outs that quietly substitute paid placements into organic playlists are forbidden.
- **No paid placement** in editorial *or* listener-curated playlists. Editors can't accept it (Role 22 enforces), and we will not build a UI flow for "promote your track on a playlist" at any tier.
- **No co-owner takeover** without owner consent — collaborative permissions are revocable; the original owner cannot be removed by a co-editor coup.
- **No deletion of attribution** — `playlistItems.addedByUserId` history is permanent (subject to user account deletion / GDPR erasure handled at the user record level).
- **No conversion of listener playlists into editorial inventory.** Editorial slots are editor-built (Role 22). Verified-listener playlists are surfaced beside editorial, not absorbed by it.
- **No private targeting use** of playlist contents — what's on a user's playlist is not exported to ad targeting.

## Open Questions
- Editor-verified threshold: track count vs. follower count vs. quality review — which dominates?
- Collaborative playlist abuse vectors (mass-add spam, hostile reorders) — which mitigations are worth the friction?
- Federated playlists: do remote followers count toward verification eligibility?
- Cover-art generation: editor-approved templates vs. user upload only?
- Should "queue sharing" sessions be recordable into a permanent playlist with one tap (with all participants' consent)?
