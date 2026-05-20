# Encore production engineering swarm (v3)

> **Canonical specs:** [ENCORE-OBSERVABLE-EXECUTION.md](./ENCORE-OBSERVABLE-EXECUTION.md) (artifacts + audit) · [ENCORE-EXECUTION-CUBAN.md](./ENCORE-EXECUTION-CUBAN.md) (value filter).

**Deterministic execution layer** — not autonomous AI, not prompt theater.

Implemented in `agents-system/` (TypeScript, Node 20+).

## One-line definition

Foundation-owned AGPL music platform with a **stateful task pipeline**: queue → agent → patch → validate → apply → audit.

## Pipeline (no exceptions)

```
TASK → AGENT → PATCH → VALIDATE → APPLY → AUDIT → COMPLETE
```

| Stage | Module |
|-------|--------|
| Queue | `core/queue.ts` + `core/task-store.ts` (JSON persistence) |
| Agent | `execution/runner.ts` + `agents/*.agent.ts` |
| Validate | `execution/validator.ts` (a11y, financial, syntax, git apply --check) |
| Apply | `execution/patcher.ts` (WRITE_FILE or unified diff via `git apply`) |
| Audit | `core/audit-log.ts` (append-only JSONL) |

## Strict task schema

```typescript
interface Task {
  id: string;
  agent: "research" | "backend" | "frontend" | "mobile" | "accessibility" | "media";
  goal: string;
  context: { repoFiles: string[]; dependencies: string[]; riskLevel: "low"|"medium"|"high" };
  constraints: {
    accessibilityRequired: boolean;
    financialSafetyRequired: boolean;
    productionGradeOnly: boolean;
    noStubOutputs: boolean;
  };
}
```

Store: `data/swarm/task-store.json` (v3). Audit: `data/swarm/audit.jsonl`.

## Agent output contract

Agents return **structured** results only:

- `status`: `complete` | `blocked`
- `summary`: string[]
- `patch.files[]`: `{ path, diff }`
- `validation`: accessibility / correctness / riskFlags

Research agent is always `blocked` with empty patch (findings only).

## Gates (hard blockers)

| Gate | When |
|------|------|
| Accessibility | `accessibilityRequired` — no innerHTML, icon buttons need labels |
| Financial | `financialSafetyRequired` — no direct balance mutation, 0% platform fee |
| No stubs | No TODO/FIXME in patch body |
| Paths | No `..`, no `.env` |
| Apply | `git apply --check` for unified diffs |

Failed validation → **requeue** (max 3 attempts) → `rejected`.

## Commands

```bash
pnpm swarm:seed
pnpm swarm:cycle              # validate + apply patches
pnpm swarm:cycle --dry-run    # validate only (via agents-system)
SWARM_DRY_RUN=true pnpm swarm:cycle
pnpm swarm:status
pnpm swarm:daemon             # 30s interval
```

## Investor cycle output

Each run writes:

1. Tasks executed — `data/archive/swarm/latest-cycle.md`
2. Patches applied — count in JSON
3. Validation results — per task
4. Risk report — `data/archive/swarm/risk-report.md`
5. Remaining gaps — from BACKLOG
6. Next highest-impact task

## What this is NOT

- Not an LLM loop (no API keys; Cursor applies complex patches)
- Not Redis yet (file-backed queue; Redis optional later)
- Not a replacement for human review on financial/legal copy

## Dual orchestration

| Command | System |
|---------|--------|
| `pnpm swarm:cycle` | v3 swarm (validate + optional apply) |
| `pnpm agents:cycle` | Legacy corporation (50 agents + handlers) |

## Related

- `docs/ENCORE-CONTINUOUS-EXECUTION-ORCHESTRATOR.md`
- `agents-system/README.md`
