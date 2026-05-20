# Encore multi-agent operating system (autonomous)

Encore runs **two** orchestration stacks:

| Stack | Path | Behavior |
|-------|------|----------|
| **Swarm** (typed) | `agents-system/` | Parallel scan agents → `data/archive/swarm/` — see `docs/ENCORE-SWARM-SYSTEM.md` |
| **Corporation** (legacy) | `agents/encore/` | 50 agents, handlers, optional auto-apply |

## Modes

| Command | Behavior |
|---------|----------|
| `pnpm swarm:cycle` | Swarm: 6 parallel repo scans → markdown + JSON archive |
| `pnpm swarm:seed` | Enqueue default swarm tasks |
| `pnpm agents:cycle` | One full cycle: scan → validate → **apply file changes** → research log → self-upgrade |
| `pnpm agents:daemon` | **Always on** — repeats cycle every 5 minutes (configurable) |
| `pnpm agents:daemon:once` | Single autonomous cycle then exit |
| `pnpm agents:stop` | Stop background daemon |
| `pnpm agents:run` | Proposals only (no auto-apply) |

## What each cycle does

1. **Self-upgrade** — ensures scripts/handlers exist; bumps `manifest.json`
2. **Waves 1–8** — scan repo, emit proposals
3. **30 role briefs** — parallel batch scan (`docs/roles/`)
4. **Validator** — rank and approve
5. **Auto-apply** — handlers modify allowed files (landing, stubs, docs, payment markers)
6. **Research** — writes `agents/research/live/latest-cycle.md`
7. **State** — `data/archive/encore/state.json` tracks cycle # and applied fingerprints (no duplicate applies)

## Configuration

`agents/encore/encore.config.json`:

- `intervalMs` — daemon sleep between cycles (default 300000 = 5 min)
- `autoApply` — write changes to repo (default true)
- `maxApplyPerCycle` — cap per cycle (default 10)
- `minScoreToApply` — minimum weighted score (default 6)

## Handlers (auto-build)

| Key | Action |
|-----|--------|
| `landing.demo-sandbox-note` | Sandbox labeling on landing |
| `landing.beta-cta` | Live beta CTA strip |
| `landing.anti-token` | No-token / AGPL trust strip |
| `landing.guarantee-link` | Link to Artist Income Guarantee |
| `landing.reduced-motion` | `prefers-reduced-motion` CSS |
| `stubs.waitlist-route` | Scaffold `waitlist.ts` |
| `stubs.transparency-page` | `transparency/index.html` |
| `stubs.press-kit` | `press/index.html` |
| `payments.wallet-scaffold` | Wallet ledger TODO in payments route |
| `docs.agent-status` | `docs/AGENT-STATUS.md` |

## Outputs

- `data/archive/encore/state.json`
- `data/archive/encore/daemon.pid` (when daemon running)
- `data/archive/encore/cycles/cycle-NNNN.json`
- `docs/AGENT-STATUS.md`
- `agents/research/live/latest-cycle.md`

## Divisions ↔ `docs/roles/`

| Division | Roles |
|----------|-------|
| Intelligence | 01–05 |
| Engineering | 06–09 |
| Catalog | 10–15 |
| Clients | 16–20 |
| Discovery | 21–25 |
| Trust | 26–29 |
| Foundation | 30 |

See `agents/encore/README.md` for wave details.
