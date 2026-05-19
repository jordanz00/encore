# Role 26 — Copyright + DMCA Workflow

## Mission
Run a credible, lawful, fast notice-and-action pipeline so Encore can host user-generated music (uploads, podcast ingests, ActivityPub mirrors) without becoming either a takedown sieve or a piracy haven. Comply with **17 U.S.C. § 512** (DMCA safe harbor, including the § 512(i) repeat-infringer policy) for U.S. operations and the **EU Copyright in the Digital Single Market Directive Article 17** "best efforts" + stay-down obligations for EU users. Publish quarterly transparency data the way Twitter/X, Cloudflare, and GitHub used to publish theirs — and submit each report to the **Lumen Database**.

## Policy
- **Notice-and-takedown.** Any rightsholder (or authorized agent) can file a DMCA notice via `/legal/dmca` web form or to `dmca@encore.audio`. Notices missing § 512(c)(3) elements (signature, identification of the work, identification of the material, contact info, good-faith statement, statement under penalty of perjury) are returned with a "what's missing" template, not silently dropped.
- **Action.** A valid notice triggers a **takedown within 24 hours** for clear matches (ISRC / UPC / waveform-fingerprint), 72 hours for ambiguous claims after triage. Affected `releases.status` flips to `takedown`; affected `tracks.moderation` flips to `removed`. The uploader receives a non-templated, plain-language explanation plus the counter-notice path.
- **Counter-notice.** Any uploader can file a § 512(g) counter-notice. We restore content **10–14 business days later** unless the claimant files suit. Counter-notice is a **single-button affordance** in the artist dashboard, never gated behind a paid plan.
- **Repeat infringer (§ 512(i)).** Three sustained valid strikes inside a rolling 12 months → account termination + payout freeze pending appeal. Strikes withdrawn by the claimant don't count. Strikes overturned on counter-notice don't count.
- **EU Article 17 stay-down.** For tracks confirmed infringing, we keep a hash of the master in a "previously removed" set. Future re-uploads matching the hash are blocked at ingest with a human-review override path. We do **not** use Article 17 to justify general filtering or pre-publication AI scanning beyond the matched-fingerprint case.
- **DMCA abuse defense.** Knowingly false notices are forwarded to the user's cited legal basis under § 512(f). Repeat false claimants are rate-limited and may be banned from the form (Role 29).

## Implementation pointers
- **Schema:** `dmcaNotices` (`claimantName`, `claimantEmail`, `goodFaithStatement`, `perjuryStatement`, `subjectsJson`, `status` ∈ {`valid`, `invalid`, `counter_noticed`, `withdrawn`}, `publishedToTransparencyReport`) in `packages/db/src/schema.ts`.
- **Routes:** new `apps/api/src/routes/legal.ts` exposes `POST /legal/dmca`, `POST /legal/dmca/:id/counter-notice`, `GET /legal/transparency/:quarter`. Takedown actions write to `releases.status = 'takedown'` and `tracks.moderation = 'removed'` via the existing release/track route modules.
- **Hooks:** ingest pipelines (`ingest-ddex.ts`, `uploads.ts`, podcast / fediverse ingest) consult the previously-removed-hash set before persisting `tracks.masterKey`.
- **Storage:** original notices stored as immutable PDFs in object storage (S3-compatible) with object-lock; only redacted copies go to the public transparency report.

## Process
1. Notice received → triage queue (24h SLA).
2. Match validation (fingerprint, ISRC, claimant verification).
3. Takedown action + uploader notification (plain-language).
4. Counter-notice window (10–14 business days).
5. Restore or sustain.
6. Quarterly: aggregate, redact, publish to `https://encore.audio/transparency/<quarter>`, submit each notice to **Lumen** (`https://lumendatabase.org/`).
7. Auditor review of strike accounting before annual report.

## Open Questions
- Do we accept DMCA notices in non-English languages at v1, or require English + machine translation?
- Article 17 "best efforts" licensing — pursue collective deals (GEMA, SACEM, PRS) before EU launch, or geofence EU until licensed?
- Should the public transparency report disclose claimant names (Lumen does), or only categories (a la Cloudflare)?
