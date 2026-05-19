# Encore Governance

This document describes how decisions are made in the Encore project.

The full rationale lives in [`docs/rfcs/008-funding-governance.md`](docs/rfcs/008-funding-governance.md). This file is the operational summary.

## Mission

Encore exists to give artists and listeners a music platform that is:

- **Free and open source** under AGPL-3.0
- **Artist-first** in economics, in product, in voice
- **Privacy-respecting** by default
- **Federated-capable** so no single corporate actor can shut it down

If a decision conflicts with the mission, the mission wins.

## Roles

### BDFL (Phase 0–2)

The project's Benevolent Dictator For Life is currently **Jordan Zabady**. The BDFL has final say on technical and mission-level questions until the maintainer council is established.

### Maintainer council (Phase 2+)

A council of 5–7 maintainers with commit access. Decisions go to majority vote. The BDFL retains tie-break and a single mission-level veto.

### Foundation board (Phase 3+)

When the project moves to a non-profit foundation, the council folds into the board. The BDFL transitions to a board member like any other.

## Phase advancement criteria

| Phase | Trigger to advance |
|---|---|
| 0 → 1 | Public launch + ≥10 external contributors |
| 1 → 2 | ≥50 external contributors OR foundation fiscal sponsorship secured |
| 2 → 3 | Foundation legally established + trademark transferred |

## Decision-making

### Routine technical decisions

- Lazy consensus (24 hours; objection moves the discussion to a thread).
- Code review by at least one maintainer required to merge.

### Architectural decisions

- New RFC required: copy `docs/rfcs/_template.md` (TODO: add) → `docs/rfcs/NNN-short-slug.md`.
- Open for ≥7 days for community comment.
- Merge requires maintainer-council majority (or BDFL approval pre-Phase-2).

### Mission-aligned decisions

Examples: "do we accept corporate sponsorship?", "do we re-license?", "do we ban a major instance from federation?"

- Require council majority + BDFL approval (pre-Phase-3) or board majority (Phase 3+).
- All decisions logged in `docs/decisions/YYYY-MM-DD-slug.md`.

## Conflicts of interest

- Editors cannot promote releases on which they hold any credit.
- Maintainers must disclose financial interest in any third-party service the project depends on.
- BDFL must disclose any business relationship that touches Encore's commercial path.

## Removal of maintainers

- A maintainer may step down at any time.
- A maintainer may be removed for sustained Code of Conduct violation, prolonged inactivity (>6 months without contribution), or breach of mission alignment.
- Removal requires council majority excluding the affected maintainer.

## Trademark and brand

- The Encore name and logo are reserved.
- Forks of the source code are welcome and expected; forks using the Encore brand require written permission.
- Full trademark policy: TBD before public launch.

## Code of Conduct

The [Code of Conduct](CODE_OF_CONDUCT.md) applies to all community spaces. Reports go to `conduct@encore.{tld}`. Enforcement is BDFL-led until a CoC committee is appointed in Phase 2.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contributor workflow.

## Funding

See [FUNDING.md](FUNDING.md) for the funding pipeline and donor list.

## Changes to governance

Changes to this document require the same process as a mission-aligned decision: council majority + BDFL approval (pre-Phase-3) or board majority (Phase 3+).
