# Encore continuous execution orchestrator

Controlled production build loop — **not** infinite autonomous execution.

## Completion definition

A task is done only when:

1. Fully implemented  
2. Fully wired end-to-end  
3. Validated (manual or automated)  
4. Accessible (WCAG 2.2 AA where UI exists)  
5. Integrated with adjacent systems  
6. No core stubs or placeholders  

## Work cycle

| Step | Action |
|------|--------|
| 1 SCAN | Inspect code, dependencies, gaps |
| 2 PLAN | Minimal full-scope slice (API + UI + edge cases) |
| 3 IMPLEMENT | Production-grade code |
| 4 INTEGRATE | Wire API, DB, web, mobile, workers |
| 5 HARDEN | Errors, loading, validation |
| 6 ACCESSIBILITY | Keyboard, SR, contrast, motion |
| 7 VERIFY | End-to-end, no broken flows |

## Simulated parallel domains (every cycle)

Architecture · Backend/API · Web · Mobile · Media · Accessibility · Performance · Ledger safety

## Priority

- **P0:** auth, playback, ledger, a11y blockers, data integrity  
- **P1:** uploads, federation, onboarding, core UX  
- **P2:** performance, polish, observability  
- **P3:** enhancements  

## Required output (7-part)

1. What was changed  
2. Why it matters  
3. Files touched  
4. What is still missing  
5. How to test  
6. Accessibility validation  
7. Next improvement  

## Related

- `docs/ENCORE-PRODUCTION-BUILD-SYSTEM.md`  
- `docs/ENCORE-MULTI-AGENT-PRODUCTION.md`  
- `docs/ENCORE-HIGH-PERFORMANCE-PROMPTS.md`  
