# @encore/agents-system

Deterministic **observable execution** for Encore — real tasks, real artifacts, real audit trail.

**Canonical docs:** [docs/ENCORE-OBSERVABLE-EXECUTION.md](../docs/ENCORE-OBSERVABLE-EXECUTION.md)

## Layout

```
src/
  core/          orchestrator (runCycle), task-store, queue, audit-log, cuban-filter
  execution/     runner, validator, patcher, metrics
  artifacts/     writeTaskArtifacts — logs, patches, reports, metrics
  agents/        scoped workers (no LLM in production path)
  cli/           seed, cycle, daemon, status
```

## Quick start

```bash
cd ../..
pnpm install
pnpm swarm:seed
pnpm swarm:cycle
pnpm swarm:status

# Investor inspect
ls data/swarm/artifacts/logs/
cat data/swarm/audit.jsonl | tail -20
cat data/archive/swarm/latest-cycle.md
```

Dry-run (artifacts still written; repo files not patched):

```bash
pnpm swarm:dry-run
```

## Evidence tree (after a cycle)

```
data/swarm/
  audit.jsonl
  artifacts/
    logs/<cycleId>/
    patches/<cycleId>/
    reports/<cycleId>/
    metrics/<cycleId>/ + <cycleId>.cycle.json
```

## AGPL

Same license as Encore.
