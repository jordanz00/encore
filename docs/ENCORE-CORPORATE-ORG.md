# Encore Corporation — agent org chart

**Always-on:** `pnpm agents:daemon` · **One cycle:** `pnpm agents:cycle`

## Structure

```
CHIEF-0 (build gate)
    ↑
META-0 (meta-supervisor — all divisions)
    ↑
Cross-supervisor peer audit (ring: each SUP audits next division)
    ↑
┌────────────┬────────────┬────────────┬────────────┬────────────┐
│ SUP-EXE    │ SUP-ENG    │ SUP-PRD    │ SUP-TRU    │ SUP-DIS    │
│ 10 agents  │ 10 agents  │ 10 agents  │ 10 agents  │ 10 agents  │
│ peer ring  │ peer ring  │ peer ring  │ peer ring  │ peer ring  │
└────────────┴────────────┴────────────┴────────────┴────────────┘
```

## Per cycle

1. **Self-upgrade** — `org.json` version + manifests
2. **50 agents** work (files in `agents/corporate/org.json`)
3. **Peer ring** — each agent reviews the next in its division
4. **Supervisor** — gates division output (10 agents → 1 SUP)
5. **Cross-SUP audit** — supervisors check each other
6. **META-0** — merges all divisions
7. **Cross-validator** — dedupe/rank
8. **CHIEF-0** — final build gate
9. **Auto-apply** — handlers patch repo
10. **Status docs** — `docs/CORPORATE-AGENT-STATUS.md`

## Config

`agents/encore/encore.config.json` — `corporationEnabled: true`, `runLegacyWaves: false`

## Live status

See `docs/CORPORATE-AGENT-STATUS.md` (auto-written each cycle).
