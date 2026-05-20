# Encore production execution (Cuban-grade reality filter)

> **Observable artifacts:** [ENCORE-OBSERVABLE-EXECUTION.md](./ENCORE-OBSERVABLE-EXECUTION.md) — logs, patches, reports, metrics per task.

**Not** an AI simulation. **Not** autonomous brainstorming. A deterministic pipeline in `agents-system/`.

## Five questions (every task)

1. Does this improve unit economics?
2. Does this reduce operational complexity?
3. Does this improve reliability or increase risk?
4. Does this ship real user value?
5. Can this scale without exponential cost?

If any answer is unclear → **do not implement** (Cuban pre-filter rejects the task).

## Pipeline

```
TASK → CUBAN_FILTER → EXECUTE → VALIDATE → APPLY → LOG → DONE
```

| Module | File | Role |
|--------|------|------|
| Orchestrator | `core/orchestrator.ts` → `runCycle()` | Sequential batch |
| Queue | `core/queue.ts` | `getNextTasks(n)` |
| Task store | `core/task-store.ts` | JSON v4, legacy v3 shim |
| Cuban filter | `core/cuban-filter.ts` | Pre-flight value gate |
| Runner | `execution/runner.ts` | Domain-scoped workers |
| Validator | `execution/validator.ts` | Correctness, simplicity, a11y, financial |
| Patcher | `execution/patcher.ts` | WRITE_FILE or `git apply` |
| Audit | `core/audit-log.ts` | Append-only `data/swarm/audit.jsonl` |

## Task contract

```ts
interface Task {
  id: string;
  domain: "backend" | "frontend" | "accessibility" | "media" | "research" | "mobile";
  objective: string;
  constraints: {
    mustBeProductionReady: true;
    mustBeAccessible: boolean;
    mustPreserveUnitEconomics: true;
    noFakeImplementations: true;
  };
  context: {
    filesTouched: string[];
    systemImpact: "low" | "medium" | "high";
  };
}
```

Agents are **scoped workers** — repo scans and structured patches only. No LLM in the production path.

## Validation gates (reject on any fail)

- Correctness (shape, syntax, `git apply --check`)
- Simplicity (patch size caps)
- Scalability (unsafe paths / env)
- Observability (non-empty summary)
- Accessibility (WCAG-oriented diff rules when `mustBeAccessible`)
- Financial / unit economics (0% platform fee, ledger safety)

## Commands

```bash
pnpm swarm:seed
pnpm swarm:cycle
pnpm swarm:dry-run
pnpm swarm:status
```

## Honest boundaries

- Encore is **not** production-launched until deploy + prod migrations + Stripe E2E are verified.
- No Redis queue, SQLite store, or axe/pa11y CI in this package yet.
- Research tasks **block** with findings — they do not auto-ship features.

## Definition of done (product)

End-to-end in production, maintainable by a small team, clear failure modes, WCAG where UI, 0% platform fee preserved, no hidden complexity.
