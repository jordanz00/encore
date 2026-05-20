# Encore — Observable execution + Apple-grade experience

Two coupled systems. Both must be real or removed.

| Layer | Purpose | Canonical paths |
|-------|---------|-----------------|
| **Execution** | Deterministic tasks, artifacts, audit | `agents-system/`, `data/swarm/` |
| **Experience** | Typography, 8pt grid, motion, a11y | `design/encore-apple-system.css` |

## Part 1 — Observable execution

### Flow

```
TASK → EXECUTE → VALIDATE → APPLY → ARTIFACT (required) → AUDIT → COMPLETE
```

### Non-negotiable

Every task run **must** write all four artifacts or the task is **INVALID**:

- `artifacts/logs/<cycleId>/<taskId>.json`
- `artifacts/patches/<cycleId>/<taskId>.patch.json`
- `artifacts/reports/<cycleId>/<taskId>.json`
- `artifacts/metrics/<cycleId>/<taskId>.json`

Enforced by `writeTaskArtifactsOrThrow()` + `validateArtifactBundle()`.

### Task contract

```typescript
constraints: {
  productionReady: true;
  accessibilityRequired: boolean;
  noFakeImplementations: true;
  costAware: true;
  appleUIRequired?: boolean;  // design system + motion tokens
}
```

### UI integration (real data)

After each cycle, `runCycle()` writes:

- `apps/web/public/execution-status.json` — consumed by `/system`
- `data/archive/swarm/execution-status.json` — archive copy

**No fake loading states.** Empty file → honest “run pnpm swarm:cycle”.

### Commands

```bash
pnpm swarm:seed
pnpm swarm:cycle
pnpm swarm:status
```

Open web: `/system` (after a cycle).

## Part 2 — Apple-grade design system

**Canonical package:** `@encore/ui-system` — see [ENCORE-UI-MOTION-SYSTEM.md](./ENCORE-UI-MOTION-SYSTEM.md)  
**CSS:** `packages/ui-system/styles/ui-system.css`  
**Web:** `apps/web/src/styles/ui-system.css` → `globals.css`  
**Landing:** `design/encore-apple-system.css` (imports ui-system CSS)

### Principles

1. Clarity over decoration  
2. Deference to content  
3. Subtle motion (`--ease-out`, 150–350ms UI)  
4. 8pt grid only (`4, 8, 16, 24, 32, 48, 64`)  
5. Single accent (Encore red + system blue for exec UI)  
6. `prefers-reduced-motion` respected everywhere  

### Motion on controls

- Buttons: `translateY(-1px)` hover, `scale(0.98)` active  
- Cards: fade + 8px rise on enter  
- Execution pulse: `.encore-exec-pulse` (only when real running state wired)

### Accessibility

WCAG 2.2 AA targets remain mandatory. Apple polish does not remove focus rings or screen reader labels.

## Shippable checklist

- [ ] `pnpm swarm:cycle` produces artifacts + `execution-status.json`  
- [ ] `/system` shows last cycle (not placeholder)  
- [ ] `design/encore-apple-system.css` present when `appleUIRequired`  
- [ ] Landing + web buttons use motion tokens  
- [ ] Prod deploy + migrations still human-verified  

## Honest boundaries

- Not production-launched until deploy/E2E verified  
- `operationCostUnits` is heuristic, not billing  
- Agents are repo scanners, not LLM codegen  
- Player 60fps progress interpolation — future player pass  

## Related

- [ENCORE-OBSERVABLE-EXECUTION.md](./ENCORE-OBSERVABLE-EXECUTION.md)  
- [ENCORE-EXECUTION-CUBAN.md](./ENCORE-EXECUTION-CUBAN.md)
