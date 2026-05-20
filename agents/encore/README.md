# Encore multi-agent system (autonomous)

Standalone for the Encore repo. Proposes, validates, **applies** safe upgrades, and can run forever.

## Quick start

```bash
# One autonomous cycle (modifies repo where handlers match)
pnpm agents:cycle

# Always on (every 5 min by default)
pnpm agents:daemon

# Stop daemon
pnpm agents:stop

# Proposals only — no file writes
pnpm agents:run
```

## Architecture

```
daemon.js ──interval──► cycle.js
                           ├── self-upgrade.js
                           ├── run-waves.js (waves 1–8)
                           ├── roles-parallel.js (30 briefs, batched)
                           ├── wave-09-validator.js
                           ├── apply-proposals.js → handlers/*
                           └── research-loop.js → agents/research/live/
```

## Scoring (wave 9)

- artistImpact 30%
- economicsTrust 25%
- designCraft 20%
- securityPrivacy 15%
- shipReadiness 10%

## Add a new auto-fix

1. Implement `handlers/my-fix.js`
2. Register in `handlers/index.js`
3. Emit `handlerKey: "my-fix"` from a wave proposal

## Related

- `docs/roles/` — 30 human role briefs
- `agents/research/reports/` — static research snapshots
- `agents/research/live/` — per-cycle live research log
