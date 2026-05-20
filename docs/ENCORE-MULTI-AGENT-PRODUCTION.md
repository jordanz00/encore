# Encore multi-agent corporate execution (production mode)

Canonical operating model for Cursor sessions targeting **production-grade** Encore — not demo polish.

## Objective

| Pillar | Target |
|--------|--------|
| Platform | Production-ready music infra (upload, playback, wallet, federation) |
| Accessibility | WCAG 2.2 AA — release-blocking |
| Scale | Honest distributed design; no fantasy capacity |
| Economics | Artist-first; 0% platform fee on artist money; transparent ledger |
| Federation | ActivityPub + Subsonic; ethical discovery (no payola) |

## Loop (never stop at one file)

```
AUDIT → RESEARCH → PLAN → IMPLEMENT → VERIFY → IMPROVE → REPEAT
```

## Executive layer

- **CHIEF-0** — prioritization, scope control, product coherence
- **META-0** — architecture, no overengineering
- **ACCESS-0** — WCAG 2.2 AA
- **ECON-0** — unit economics, storage/egress realism (`docs/UNIT-ECONOMICS.md`)
- **TRUST-0** — no fake metrics; demo labels on wallet/pools

## Divisions (parallel every cycle)

| Division | Lead | Agents |
|----------|------|--------|
| Platform | PLATFORM-SUP | API-1, DB-1, WALLET-1, FED-1, AUTH-1, SEARCH-1, WORKER-1 |
| Experience | UX-SUP | WEB-1, PLAYER-1, DESIGN-1, A11Y-1, COMPONENT-1 |
| Media | MEDIA-SUP | FFMPEG-1, STREAM-1, STORAGE-1, INGEST-1 |
| Discovery | DISCOVERY-SUP | RECS-1, RADIO-1, SEARCH-RANK-1, CATALOG-1 |
| Trust & safety | TRUST-SUP | MOD-1, ABUSE-1, REPORTS-1, LEGAL-1, PRIVACY-1 |
| Infrastructure | OPS-SUP | DEVOPS-1, OBSERVE-1, CACHE-1, COST-1, SECURITY-1 |

## Priority queue

| Level | Examples |
|-------|----------|
| **P0** | Auth broken, ledger wrong, a11y blockers, data corruption, deploy blockers |
| **P1** | Playback, uploads, federation, onboarding, core UX |
| **P2** | Performance, DX, observability |
| **P3** | Experiments |

Live backlog: `docs/BACKLOG.md`.

## Required session output (substantial passes)

1. **What changed**
2. **Why it matters**
3. **Files touched**
4. **Risks introduced**
5. **Verification steps**
6. **Accessibility check**
7. **Next highest-leverage improvement**

## Non-negotiables

- Inspect before modify; small typed diffs
- AGPL-safe; no secrets in repo
- Never invent stats or “production live” claims
- Incomplete stubs must be labeled in UI/docs

## Related docs

- `docs/ENCORE-CORPORATION.md` — charter
- `docs/CORPORATION-STATUS.md` — honest snapshot
- `docs/CAVEMAN-EXECUTION.md` — execution discipline
- `docs/ACCESSIBILITY.md` — a11y baseline
- `.cursor/rules/encore-corporation.mdc` — always-on rule
