# RFC 008 — Funding & Governance

## Status

Proposed.

## Context

Encore is licensed AGPL-3.0 and intends to remain a public-good project for the foreseeable future. To stay alive — to pay the people who run the editorial team, the trust + safety lead, and the infrastructure — we need a deliberate funding model that does not compromise the mission. We also need a governance model that scales beyond a single benevolent dictator and survives that dictator changing roles.

## Decision

### License

- **Code:** AGPL-3.0-or-later. Network copyleft prevents proprietary SaaS forks from privatizing community contributions.
- **Docs:** CC-BY-SA-4.0.
- **Public TS SDK (`packages/sdk`):** MIT-licensed separately, so third-party clients can adopt it without copyleft concerns.
- **Brand assets** (name "Encore", logo): reserved while project is active; trademark policy TBD.

### Trademark policy

- The name "Encore" and the logo may not be used by forks that materially diverge from the upstream behavior or violate the Code of Conduct.
- A fork of the source code is welcome and expected; a fork using the Encore brand requires written permission.
- A short trademark policy (BSD-style) lives in `TRADEMARK.md`.

### Governance roadmap

| Phase | Structure | Trigger to advance |
|---|---|---|
| 0 | BDFL (Jordan Zabady) | v0.0.x; pre-launch |
| 1 | BDFL + 2-3 maintainer reviewers | Post-launch; ≥10 external contributors |
| 2 | Maintainer council (5-7), majority vote on technical decisions; BDFL retains tie-break + veto on mission-critical questions | ≥50 external contributors OR foundation fiscal sponsorship secured |
| 3 | Non-profit foundation (Software Freedom Conservancy fiscal sponsorship is one path; new music-platform foundation another); BDFL becomes a board member | Funding stable; council ready; trademark transferred |

### Funding pipeline (priority order)

1. **Grants** — NLnet NGI Zero Core / Commons / Entrust; Open Technology Fund; Sovereign Tech Fund / Resilience program; Mozilla MOSS; FUTO grants. Apply for the first round in v0.1 once a basic public deployment is live.
2. **Recurring donations** — GitHub Sponsors + Open Collective + Liberapay. Targeted at individual maintainers and the project umbrella.
3. **Subscription revenue** — when the Encore-hosted instance launches a paid tier (RFC 006), platform overhead contributes to project funding.
4. **Foundation grants** — from the eventual foundation, redistributed for explicit work (editorial, T+S, infra).
5. **Corporate friendships** — explicitly NOT corporate sponsorship. We will accept service donations (CDN credit, Stripe processing fee waiver) on terms that do not influence product decisions; we will document these in `FUNDING.md`.

### Contributor agreement

- DCO sign-off on every commit (`Signed-off-by: Name <email>` in commit message).
- **No CLA.** AGPL-3.0 + DCO is sufficient legal hygiene; CLAs concentrate power and discourage casual contribution.

### Decision-making

- Routine technical decisions: lazy consensus (24 hours; objection moves to discussion).
- Architectural decisions: new RFC required; minimum 7 days open for review; merge requires maintainer-council majority.
- Mission-aligned decisions (e.g. "do we accept corporate sponsorship?"): require council majority + BDFL approval.
- All decisions logged in `docs/decisions/YYYY-MM-DD-slug.md`.

### Code of Conduct

- Adopt **Contributor Covenant 2.1** verbatim in `CODE_OF_CONDUCT.md`.
- Enforcement responsibility: BDFL initially; CoC committee post-Phase-2.
- Enforcement reports go to `conduct@encore.audio`.

### Security disclosure

- Private intake at `security@encore.audio`.
- Acknowledgement target: 48 hours.
- Patch + disclosure target: 90 days (industry standard).
- CVE assignment via GitHub Security Advisories.
- Hall-of-fame for responsible disclosures in `SECURITY.md`.

## Alternatives Considered

| Choice | Considered | Why not |
|---|---|---|
| MIT or Apache-2.0 | Wider corporate adoption | Loses the network-copyleft protection AGPL-3.0 provides against proprietary SaaS capture |
| Custom license (Server Side Public License, BUSL) | Stronger anti-cloud | Not OSI-approved; fragments the OSS ecosystem; rejected by Debian/Fedora |
| Single-corporation sponsorship | Funded fast | Conflicts with mission; every previous "open" platform that took this route changed |
| For-profit benefit corp + open source fork | Hybrid | Pulls energy in two directions; eventual mission drift risk |

## Consequences

- AGPL-3.0 deters proprietary SaaS competitors from forking and selling, which is the point.
- Some corporate users will not deploy AGPL software internally; that is a feature, not a bug, for our specific case.
- Without a CLA, future re-licensing requires unanimous contributor consent; we accept this as a forcing function against changing license under pressure.

## Open Questions

- Foundation: Software Freedom Conservancy vs new music-platform foundation? SFC is faster to set up; new foundation is more focused.
- Trademark transfer: does the BDFL hold the mark personally, transfer to foundation on Phase 3, or assign to a holding entity earlier?
- "Editorial team" funding: do we pay editors a per-month stipend from grants, or volunteer-only with rotating slots?
- Contributor recognition: financial bounties for security researchers via HackerOne or open-only contributor recognition?
