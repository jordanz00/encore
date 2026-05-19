# Role 27 — Moderation Without Surveillance

## Mission
Keep Encore safe from the small set of harms that absolutely have to be policed (CSAM, doxxing, credible threats, coordinated harassment, illegal sales) **without** building a surveillance stack on top of every listener. No persistent listening profile is ever consulted for moderation. No general-purpose AI risk score is attached to a user. Moderation runs on **content + context + human report**, not on the listener's history.

## Policy
- **CSAM is non-negotiable.** Cover art is hashed with **PhotoDNA** at upload; matches are removed automatically and reported to **NCMEC CyberTipline** as required by **18 U.S.C. § 2258A**. PhotoDNA is used **only** for known-CSAM matching — never for "general image classification," never for adult content, never for copyright.
- **No general AI scoring of users.** We do not run hate-speech, sentiment, or "toxicity" classifiers across the entire catalog by default. Classifiers exist as **opt-in artist tools** ("flag suspected harassment in my comments") and as **moderator-side triage aids** on already-reported content. Their scores never persist on the user record and never affect feed ranking.
- **Community report queue is the spine.** Every public surface (track, release, comment, artist profile, podcast episode) has a "Report" affordance. Reports are reviewed by humans on a published SLA: 1 hour for imminent-harm flags (CSAM, threats), 24 hours for harassment, 72 hours for everything else.
- **Appeals.** Every removal can be appealed once. A different moderator reviews. Outcomes (sustain, reduce, overturn) are logged and counted in the transparency report.
- **No persistent listener profile for moderation.** Moderators see the **reported item** and the **immediate context** (the thread, the artist page, the playlist). They do not see "this user listened to X for Y minutes last Tuesday" because per-listen data largely isn't there to begin with (Role 28).
- **Transparency.** Quarterly report covers: reports filed by category, removals, restorations on appeal, NCMEC referrals (count, not content), classifier opt-in usage stats.

## Implementation pointers
- **Schema:** `moderationReports` (`reporterUserId`, `subjectType` ∈ {`track`, `release`, `user`, `comment`, `podcast_episode`}, `subjectId`, `reason`, `details`, `status`, `reviewedByUserId`, `reviewedAt`, `outcome`) in `packages/db/src/schema.ts`. The existing `moderationStatus` enum (`pending` | `approved` | `flagged` | `removed` | `appealing`) lives on `releases.moderation`, `tracks.moderation`, and `comments.moderation`.
- **Routes:** new `apps/api/src/routes/moderation.ts` exposes `POST /moderation/reports`, `GET /moderation/reports/mine`, `POST /moderation/reports/:id/appeal`, plus moderator-only `GET /moderation/queue` and `POST /moderation/reports/:id/decide`. Image-hash check sits in `apps/api/src/routes/uploads.ts` for cover art and in the worker for ingested releases.
- **PhotoDNA integration** runs server-side only, on cover art bytes; no listener identifier is attached. Match → `releases.moderation = 'removed'` + NCMEC referral job.
- **Classifier opt-ins:** stored as artist preferences in a future `artists.preferencesJson` field; never global.

## Process
1. Report submitted → queue with severity tag.
2. Human review against published rules (`docs/policies/community-rules.md`, TBD).
3. Action: keep, label, hide, remove, escalate.
4. Subject + reporter both notified in plain language.
5. Appeal window (14 days).
6. Quarterly transparency export.

## Open Questions
- Distributed moderation (per-instance rules in a federated future, RFC 005) — how do we publish our policy in a machine-readable way (e.g. Mastodon `/api/v1/instance` style)?
- Do we offer artists a per-track "comments off" toggle, or a "slow mode" rate limit, before classifier opt-in?
- How do we credit and protect human moderators (wage floor, mental-health support, tenure caps) when paid moderation exists?
- Should NCMEC referral counts appear in the transparency report at all, or be reported only privately to oversight (the way most platforms do)?
