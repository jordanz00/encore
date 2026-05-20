# Encore high-performance execution prompt pack

Copy-paste prompts for Cursor sessions. **Do not stop after MVP** — always expand to adjacent systems.

## Core loop

```
AUDIT → FIX → HARDEN → IMPROVE → VERIFY → CONTINUE
```

## Core execution (1–10)

| # | Prompt |
|---|--------|
| 1 | Audit this subsystem fully. Fix all broken, incomplete, or stubbed behavior end-to-end. |
| 2 | Do not stop after initial implementation. Harden this for production use. |
| 3 | Find the weakest part of this system and fix it first. |
| 4 | Assume this will run at scale in production. Upgrade accordingly. |
| 5 | Continue improving until no obvious UX, accessibility, or architecture issues remain. |
| 6 | Treat missing edge cases as real bugs and fix them. |
| 7 | Refactor for long-term maintainability, not quick completion. |
| 8 | Ensure this integrates cleanly with the rest of the Encore system. |
| 9 | Remove duplication and unify logic across modules. |
| 10 | Upgrade this to production-grade quality, not prototype quality. |

## Accessibility — WCAG 2.2 AA (11–20)

| # | Prompt |
|---|--------|
| 11 | Audit for WCAG 2.2 AA compliance and fix all violations. |
| 12 | Ensure full keyboard navigation support. |
| 13 | Ensure full screen reader compatibility. |
| 14 | Fix contrast, spacing, and readability issues. |
| 15 | Ensure no mouse is required for full functionality. |
| 16 | Replace all non-semantic UI patterns with accessible equivalents. |
| 17 | Add proper ARIA roles and semantic HTML where missing. |
| 18 | Ensure reduced motion support is implemented correctly. |
| 19 | Make mobile accessibility fully compliant. |
| 20 | Treat all accessibility issues as P0 production bugs. |

## Music platform quality (21–30)

| # | Prompt |
|---|--------|
| 21 | Upgrade this to production-grade music streaming behavior. |
| 22 | Fix playback edge cases (pause, resume, tab switch, background audio). |
| 23 | Implement reliable queue persistence. |
| 24 | Ensure buffering and streaming are resilient under poor network conditions. |
| 25 | Ensure audio system behaves like a professional streaming platform. |
| 26 | Normalize playback assumptions to industry standards (Spotify/Apple-level UX expectations). |
| 27 | Fix all timing, sync, and playback state inconsistencies. |
| 28 | Ensure offline and caching behavior is stable where applicable. |
| 29 | Improve waveform/audio UI consistency and accuracy. |
| 30 | Ensure audio transitions are smooth and glitch-free. |

## Architecture (31–40)

| # | Prompt |
|---|--------|
| 31 | Refactor into clean modular architecture with clear boundaries. |
| 32 | Remove coupling between unrelated systems. |
| 33 | Simplify system design while preserving functionality. |
| 34 | Convert this into scalable production-grade structure. |
| 35 | Align implementation with Encore monorepo architecture patterns. |
| 36 | Replace fragile logic with deterministic systems. |
| 37 | Eliminate duplicated logic across backend/frontend/worker layers. |
| 38 | Ensure all data flows are consistent across services. |
| 39 | Prevent circular dependencies and architectural drift. |
| 40 | Make this system easy to maintain long-term. |

## Wallet / economic integrity (41–45)

| # | Prompt |
|---|--------|
| 41 | Ensure ledger system is append-only and cannot corrupt balances. |
| 42 | Validate all financial flows for correctness and idempotency. |
| 43 | Prevent double counting or race conditions in payouts. |
| 44 | Ensure 0% platform fee rule is strictly enforced. |
| 45 | Audit all economic logic for consistency and correctness. |

## Full feature completion (46–50)

| # | Prompt |
|---|--------|
| 46 | Complete this feature end-to-end across frontend, backend, and worker systems. |
| 47 | Replace all placeholder or stub logic with production implementations. |
| 48 | Wire all disconnected components into a fully working system. |
| 49 | Ensure all API endpoints used by this feature are fully implemented. |
| 50 | After completion, identify the next highest-impact improvement and begin it immediately. |

## Effective combinations

| Goal | Prompts |
|------|---------|
| Accessibility full pass | 11 + 13 + 16 + 20 |
| Playback upgrade | 21 + 23 + 24 + 25 |
| Architecture refactor | 31 + 34 + 36 + 37 |
| Feature completion | 46 + 47 + 48 + 50 |
| Wallet hardening | 41 + 42 + 43 + 45 |

## Related

- `docs/ENCORE-MULTI-AGENT-PRODUCTION.md` — corporate divisions + 7-part output
- `docs/CAVEMAN-EXECUTION.md` — no fake done
- `.cursor/rules/encore-corporation.mdc` — always-on
