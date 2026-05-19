# Role 04 — SoundCloud Audit

## Mission
SoundCloud is the social, comment-on-the-waveform, demo-and-mixtape platform that built the early careers of an entire generation of independent artists. Audit what made it culturally sticky (timed comments, reposts, low-friction upload, "first place a rapper drops a track"), what broke (the monetisation model, the moderation, the multiple near-bankruptcies, the SoundCloud Go pivots), and which patterns Encore should replicate without repeating the errors. Findings drive the comments / reposts / follows surfaces in `packages/db/src/schema.ts`, the upload flow in `apps/api/src/routes/uploads.ts`, and the social UI in `apps/web/src/app/`.

## Keep
- **Waveform-anchored timed comments.** A comment lives at a millisecond timestamp and renders as a marker on the waveform — readable while the track plays. Already first-class in our schema: `comments.anchorMs` plus a `(track_id, anchor_ms)` index. The renderer lives in `packages/player/` (waveforms via `wavesurfer.js`, see Role 16).
- **Reposts as a social primitive distinct from likes.** A repost broadcasts a track to your followers without claiming authorship. Modelled in `reposts` with an optional `note` column for the "why I'm sharing this" caption.
- **Low-friction upload.** Drag a WAV / MP3, fill three fields, publish. Maps to `apps/api/src/routes/uploads.ts` (multipart) and `releases.status = 'draft'` → `'published'` flow. Cover-art and ISRC are optional; the artist can add them later.
- **Track pages with comments + plays + reposts on the same surface.** Public counters via `track_play_counters`; comment thread via `comments`; social proof via `follows`, `likes`, `reposts`.
- **Embed everywhere.** A SoundCloud embed in a blog post / Twitter thread is a discovery vector that costs nothing. We expose `/embed/track/{id}` and `/embed/playlist/{id}` (route stub belongs alongside `apps/api/src/routes/tracks.ts` + an oEmbed endpoint).
- **Demo-friendly upload limits.** Free uploads with sane storage caps; paid creator tier raises the cap. Maps to `subscriptions.tier` + a per-tier upload quota worker check.
- **DJ mixes / long-form audio** as a first-class content type, not a fight against three-minute pop conventions.

## Drop
- **Fan-Powered / pro-rata royalty confusion.** SoundCloud has shipped multiple incompatible payout models over the years (pro-rata, fan-powered for some artists, not for others). Listeners and artists can't predict their cheque. Encore ships **one** transparent model per tier, documented per period in `payouts`.
- **Stripped-down free experience that nags constantly.** Free should be free; ads should be contextual (`adCampaigns.targetingJson`) and limited.
- **Moderation gaps.** SoundCloud has a long tail of misappropriated tracks, leaked stems, and undocumented sample use; takedown is slow. We model `moderationReports`, `dmcaNotices`, and per-track `moderation` status from day one and publish a transparency report.
- **Ambiguous monetisation eligibility.** Artists shouldn't have to qualify for monetisation; a sale is a sale (`sales`), a tip is a tip (`payouts.tipsCents`), a stream over the threshold counts (`plays.isVerifiedPlay`).
- **Mobile feature lag** behind web for years at a time. Role 17 ships parity from v1.

## Recommendations for Encore
1. **Timed comments are core, not optional.** The waveform component in `packages/player/` exposes a `comments[]` prop and the `apps/web/` track page renders markers that ripple in as the playhead reaches them. Comments inherit `moderation` status; flagged comments are hidden from the waveform but stay readable to mods.
2. **Reposts have a 280-char `note`.** The `reposts.note` column is already there — make sure the UI surfaces it. A repost-with-note is the Encore version of a quote-tweet for music.
3. **Public-by-default tracks, private-link drafts.** `releases.status = 'draft'` plus a signed share URL for private demo links sent to labels / collaborators. Implement with a `share_links` table tracked under a future RFC.
4. **Open upload limits that scale with subscription tier**, never with monetisation eligibility. Quota check in `apps/worker/src/jobs/`.
5. **Embed contract.** oEmbed endpoint + a hardened iframe on `embed.encore.audio` — the public web's discovery surface.
6. **DJ-mix support.** HLS playlist of long-form audio with chapter markers. Reuse `podcastEpisodes.chaptersJson` shape on a future `mix_chapters` column on `tracks`, or a dedicated table.
7. **No "qualify for monetisation" gate.** Day-one default: every artist can accept tips and sales.

## Open Questions
- Track-level vs comment-level moderation thresholds — auto-hide at N flags, or always human-reviewed?
- Should comment markers be visible in the waveform on the **artist's own page** even when the artist has muted them on their feed?
- Rights handling for DJ mixes that include third-party tracks — Mixcloud-style PRO licensing, takedown-on-claim, or refuse uploads we can't license?
- Repost amplification — do we cap how many times a single track can ripple via `reposts` per day (anti-spam), or trust the federated moderation queue?
- Embed analytics — do we count embedded plays toward `track_play_counters` and `payouts.streamingCents`, and what's the fraud surface there?
