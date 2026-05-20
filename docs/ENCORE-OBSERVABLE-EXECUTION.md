# Encore — Observable execution + reality-first engineering

> **Combined spec (execution + Apple UI):** [ENCORE-APPLE-PRODUCTION-SYSTEM.md](./ENCORE-APPLE-PRODUCTION-SYSTEM.md)

**Not a prompt system. Not an AI swarm.** A deterministic pipeline where **every action leaves evidence**.

## Core truth (Cuban filter)

The system is only valuable if it proves:

1. Real work (not descriptions)
2. Measurable outputs
3. Cost-awareness and scalable design
4. Maintainable simplicity
5. Survives failure with recorded reasons

**If it cannot be observed, logged, and verified → it does not exist.**

## Principle: no output without evidence

Every task run writes **at least one** of:

| Artifact | Path |
|----------|------|
| Execution log | `data/swarm/artifacts/logs/<cycleId>/<taskId>.json` |
| Patch bundle | `data/swarm/artifacts/patches/<cycleId>/<taskId>.patch.json` |
| Validation report | `data/swarm/artifacts/reports/<cycleId>/<taskId>.json` |
| Task metrics | `data/swarm/artifacts/metrics/<cycleId>/<taskId>.json` |
| Cycle rollup | `data/swarm/artifacts/metrics/<cycleId>.cycle.json` |
| Immutable audit | `data/swarm/audit.jsonl` |

Rejections and Cuban-filter skips **also** write artifacts (no invisible failures).

## Flow

```
FETCH → EXECUTE → ARTIFACTS → VALIDATE → APPLY | REJECT → AUDIT
```

Implementation: `agents-system/src/core/orchestrator.ts` → `runCycle()`.

## Task contract

```typescript
interface Task {
  id: string;
  domain: "backend" | "frontend" | "accessibility" | "media" | "research" | "mobile";
  objective: string;
  constraints: {
    productionReady: boolean;
    accessibilityRequired: boolean;
    noFakeImplementations: boolean;
    costAware: boolean;
  };
  context: {
    filesTouched: string[];
    systemImpact: "low" | "medium" | "high";
  };
}
```

## Investor questions (by design)

After `pnpm swarm:cycle`, you can answer:

- **Show me the logs** → `data/swarm/artifacts/logs/<cycleId>/`
- **What failed?** → `reports/` + `audit.jsonl` (`TASK_REJECTED`, `TASK_BLOCKED`)
- **What does it cost per operation?** → `metrics/<cycleId>/<taskId>.json` → `operationCostUnits`
- **Task history** → `task-store.json` + archive `data/archive/swarm/latest-cycle.json`

`operationCostUnits` is a **heuristic** (file count × impact), not billing.

## Commands

```bash
pnpm swarm:seed
pnpm swarm:cycle
pnpm swarm:dry-run
pnpm swarm:status
```

## Honest boundaries

- Encore is **not production-launched** until deploy + prod migrations + Stripe E2E are verified.
- Task store is **JSON file**, not Postgres; queue is **in-process**, not Redis.
- Agents are **deterministic repo scanners**, not LLMs.
- WCAG sign-off still requires human audit + axe/pa11y CI (not in this package yet).

## Related

- [ENCORE-EXECUTION-CUBAN.md](./ENCORE-EXECUTION-CUBAN.md) — pre-flight value filter
- [ENCORE-SWARM-SYSTEM.md](./ENCORE-SWARM-SYSTEM.md) — module map
