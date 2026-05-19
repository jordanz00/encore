# Role 30 — Governance + Funding

## Mission
Build an organization that can outlive its founder, accept money without selling its soul, and ship a license (AGPL-3.0) that protects the listener, the artist, and the contributor. Move from a single-maintainer project (BDFL) through a small maintainer council to an eventual non-profit foundation, with **funding diversified across grants, sponsorships, and direct support** — never a single dependency that can pull the rug.

## Policy
- **License: AGPL-3.0-or-later.** Any network deployment of Encore must offer source. This is the single biggest moat against the "embrace-extend-extinguish" pattern incumbents will run if the project gains traction. Contributors retain copyright; no CLA, no copyright assignment.
- **Contributor agreement: DCO sign-off only.** Every commit carries `Signed-off-by:` per the **Developer Certificate of Origin v1.1**. We do not run a CLA: it concentrates ownership, slows good-faith contribution, and pattern-matches to corporate capture.
- **Code of Conduct: Contributor Covenant 2.1**, with a published reporting address (`conduct@encore.audio`) staffed by at least two unrelated council members. Outcomes published in the annual transparency report (counts and categories, not names).
- **Trademark policy.** "Encore" and the logo are trademarked separately from the AGPL code. Forks are welcome; calling a fork "Encore" without compatibility certification is not. Policy modeled on **Mozilla's** and **Mastodon's** trademark guidelines.
- **Governance roadmap.**
  - **Phase 1 — BDFL.** Jordan Zabady has final say. Public roadmap. PRs reviewed and merged by the BDFL or invited maintainers.
  - **Phase 2 — Maintainer council (5–7).** Recruited from sustained contributors across surfaces (web, mobile, API, infra, design, community). Lazy-consensus decision-making; supermajority (5/7) for license, governance, or trademark changes.
  - **Phase 3 — Non-profit foundation.** Fiscal-sponsored under the **Software Freedom Conservancy** (one option; alternatives: **Open Collective Foundation**, **NumFOCUS** for the data side, or stand-alone 501(c)(3)). Foundation owns trademark, infra contracts, and grant disbursement. Maintainer council retains technical authority.
- **Funding pipeline (none gives veto power).**
  - **NLnet NGI Zero** (federation, privacy work — recurring small grants, EU-funded).
  - **Open Technology Fund** (privacy / anti-censorship).
  - **Sovereign Tech Fund** (digital infrastructure, Germany).
  - **Mozilla MOSS / Open Source Support.**
  - **FUTO** (independent grant-maker, music + decentralization aligned).
  - **GitHub Sponsors** (recurring micro-funding).
  - **Open Collective** (transparent budget, public ledger).
  - Direct artist tips and a small platform fee on payment-processor margin (Role 22 / Role 23).
- **Sustainability target.** No single funder > 35% of annual budget. Reserve fund target = 9 months of operating cost before paid headcount expands.

## Implementation pointers
- **Repo files:** `LICENSE` (AGPL-3.0), `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1), `CONTRIBUTING.md` (DCO + style + review), `GOVERNANCE.md` (this role's distillation), `TRADEMARK.md`, `SECURITY.md` (RFC 008).
- **Schema (no direct table — governance is mostly out-of-band).** Foundation funding ledger lives in **Open Collective**, mirrored to a static page; we do not store contributor PII in `users`.
- **Routes:** `apps/api/src/routes/health.ts` is the only governance-touching route today (uptime / version exposure for grant reporting); funding/foundation surfaces are static pages.

## Process
1. **Quarterly council meeting** (public minutes; closed personnel discussion only).
2. **Annual transparency report** — funding sources, spend categories, governance changes, CoC actions, DMCA + moderation stats (cross-cut with Roles 26/27).
3. **Public roadmap** in GitHub Projects; RFC for any change crossing two surfaces.
4. **Bus-factor review** every six months: every critical surface needs at least two maintainers.

## Open Questions
- BDFL → council transition trigger: time-based (24 months) or contributor-base-size-based (e.g. 25 sustained contributors)?
- Foundation home: Software Freedom Conservancy (musician-friendly track record), Open Collective Foundation (faster), or standalone 501(c)(3) (most control, most overhead)?
- Trademark enforcement budget: do we set aside a defense fund, or rely on the foundation's pooled legal?
- Should we accept corporate sponsorships at the foundation level, with a published "no roadmap influence" clause, or refuse them outright (a la **curl**)?
