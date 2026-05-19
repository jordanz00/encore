# Role 12 — Merlin Onboarding + Indie Label Relations

## Mission
Get Encore onto Merlin, the global digital rights agency for the independent label sector, so the thousands of indie labels Merlin represents can deliver to us under one master licence rather than negotiating individually. Merlin membership is the credibility unlock for indie catalog parity with Spotify, Apple Music, and Amazon Music — and it is the cleanest path for a small platform to license a wide indie footprint. The role owns the full pathway: eligibility, application, master agreement, technical onboarding, reporting cadence, and payout schedules. It also owns direct one-off label deals that fall outside Merlin (e.g. Beggars, Secretly, Domino branches that license direct in some territories).

## Today
We have a schema slot — `labels.merlinId` in `packages/db/src/schema.ts` — and a placeholder reference in the schema header comment ("Merlin member id, if onboarded (RFC 002)"). Nothing else exists: no application submitted, no DPID assigned, no DDEX feed configured for Merlin, no DSR cadence, no payout schedule. The DDEX ingest pipeline (`apps/api/src/routes/ingest-ddex.ts`) is the technical foundation Merlin will plug into, but it is itself a stub today.

## Spec
1. **Eligibility & application.** Merlin requires an operational platform with verifiable user metrics and a clear royalty-accounting story. Prepare an application packet: company structure, beneficial ownership, monthly active listeners (MAU) projection, a description of the streaming + sales models, and the payout calculation methodology (User-Centric Payment System per RFC 006). Submit, expect a multi-month diligence process.
2. **Master agreement.** Standard Merlin terms include a per-stream royalty floor, advances or minimum guarantees in some cases, audit rights, takedown windows, marketing-restriction clauses, and a most-favoured-nation clause against major-platform terms. Treat the negotiation as legal-counsel-led; Role 12 is the operational owner, not the dealmaker.
3. **Technical onboarding.** Merlin delivers via DDEX ERN-4 (same pipe as Role 11). They expect: a per-DPID delivery endpoint, asset pull credentials, ISRC/UPC integrity checks, and a confirmation message per delivery within minutes.
4. **Reporting cadence.** Merlin expects DSR-class usage reports monthly per member-label (not per Merlin-aggregate), broken out by territory, with verified-play counts and net consumer revenue. The pipeline must split aggregate Merlin deliveries back into the individual member-label reports Merlin's distribution requires.
5. **Payout schedule.** Monthly accrual, monthly remittance — bank wire to Merlin in USD, EUR, or GBP depending on the member-label's jurisdiction, by an agreed cut-off. Reconciliation happens against the DSR file Merlin distributes back to its members.
6. **Direct indie label outreach.** A handful of major indie labels still license direct in specific markets. Maintain a deal pipeline (Beggars, Secretly, Domino, Sub Pop, Mom+Pop, Stones Throw, Ninja Tune, etc.) for territories where Merlin does not represent them.

## Implementation Notes
- `packages/db/src/schema.ts` — `labels.merlinId` already holds the Merlin member id; add a `labelDeals` table later for direct deals (member-label, territory, term, royalty rate, MFN clause, takedown SLA).
- `apps/api/src/routes/ingest-ddex.ts` — Merlin will be a single `ingest_sources` row with `distributorRef = "merlin"` and a Merlin-specific HMAC secret. The same delivery endpoint serves Merlin and the DIY distributors.
- `apps/worker/src/jobs/podcast-poll.ts` — irrelevant to Merlin; mentioned only because it is the closest sibling to the future `ddex-delivery.ts` worker that will fan out per-member-label DSR generation.
- DSR generation should query `plays` joined to `tracks` joined to `releases.labelId`, grouped by member-label and territory. The result file lands in a per-member-label S3 prefix; Merlin pulls or we push.

## Open Questions
- Apply for Merlin membership before or after launch — chicken-and-egg with their MAU expectations?
- Do we negotiate a per-stream rate floor up front, or accept Merlin's standard terms and revisit at renewal?
- For direct indie deals outside Merlin, do we need a separate ingest path, or can they all use the same DDEX endpoint?
- Audit rights: who is the named auditor — Merlin's preferred firm, or do we propose alternatives?
