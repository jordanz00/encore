# Adversarial founder mode

Encore must survive simultaneous scrutiny from:

- elite investors and operators (Shark Tank standard),
- hostile competitors,
- skeptical infrastructure engineers,
- cynical musicians,
- accessibility auditors,
- open-source critics,
- regulators,
- platform economists.

**You are not only building software.** You are building infrastructure that must withstand the hardest possible critics in the same room.

## Final rule (before any major decision ships)

> If the hardest investor, hardest engineer, hardest accessibility auditor, hardest musician, and hardest open-source critic were together — **would this answer survive?**

If not, keep improving. Do not hand-wave.

## Required behavior on every substantial implementation

**Proactively** (do not wait to be asked):

1. Answer likely criticisms in PR notes / honesty footers.
2. Name economic weaknesses and unit-cost assumptions.
3. Name scaling breakpoints (10k / 100k / 1M users).
4. Name governance and enshittification risks.
5. Name trust and adoption friction.
6. Run the **red team pass** below; fix or document gaps.

## Forbidden responses (automatic fail)

- “We’ll figure it out later”
- “AI will solve it”
- “We’ll scale when needed”
- “Growth will cover costs”
- “Community moderation” (without staffing + escalation design)
- “Viral growth”
- “Network effects” (without interoperability story)

Every major system needs:

| Lens | Minimum artifact |
|------|------------------|
| Operational | Who runs it, on-call, cost driver |
| Sustainability | Revenue or grant path; lean-period behavior |
| Scaling | Bottleneck + mitigation at 10× / 100× |
| Governance | Who can change rules; fork path |
| Failure modes | What breaks first; degrade behavior |

## Build real advantages (not theater)

Continuously strengthen:

1. **Trust** — ledger, transparency, demo vs live labels (`wallet_ledger`, `transparency/`)
2. **Structure** — foundation path, AGPL, no equity exit (`docs/rfcs/008-funding-governance.md`)
3. **Interoperability** — ActivityPub, Subsonic, export (P2-8 in `docs/BACKLOG.md`)
4. **Operational efficiency** — compose deploy, presign media (`docs/DEPLOY-BETA.md`)
5. **UX** — calm, accessible surfaces (`docs/ACCESSIBILITY.md`)

## Red team pass (after substantial work)

Attack your own delivery on eight axes, then patch or file backlog:

1. **Design** — complexity, single points of failure  
2. **Economics** — who pays; hidden fees; processor dependency  
3. **Scalability** — DB, object storage, egress, workers  
4. **Accessibility** — WCAG, keyboard, low bandwidth  
5. **Governance** — mission drift, sponsor capture, trademark  
6. **Moderation** — DMCA, abuse, human hours per upload  
7. **Onboarding** — artist time-to-first-sale; fan time-to-first-play  
8. **Maintainability** — bus factor; docs; test coverage on money paths  

Document findings in honesty footers. Link gaps to `docs/BACKLOG.md` IDs.

## Interrogation playbook

The **top 20 investor-grade questions** with honest beta-era answers live in:

**[`docs/INVESTOR-INTERROGATION.md`](INVESTOR-INTERROGATION.md)** (top 20 + full index appendix)

**[`docs/UNIT-ECONOMICS.md`](UNIT-ECONOMICS.md)** — egress/storage/transcode ASSUMPTION model (required for infra-investor questions).

**[`docs/SCRUTINY-PASS-TEMPLATE.md`](SCRUTINY-PASS-TEMPLATE.md)** — paste into major PRs.

Update interrogation + unit economics when economics, infra, or governance materially change. Do not invent MAUs, pool rates, or live payout totals.

## Optimize for

- durability, trust, operational sanity, maintainability  
- artist retention, global accessibility, sustainable economics, legitimacy  

## Not for

- demo impressiveness, investor theater, vanity metrics, superficial expansion  

## Related

- `docs/SUSTAINABILITY.md` — multi-decade operating philosophy  
- `docs/ENCORE-EXECUTION-CHARTER.md` — ship gates + honesty format  
- `ARTIST-ECONOMICS.md`, `docs/rfcs/006-payments-payouts.md`, `docs/rfcs/008-funding-governance.md`  
