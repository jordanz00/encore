# Encore production build system (Cursor orchestration)

Operating mode for building a **real** production-grade Encore app across web, mobile, desktop, API, and workers.

## Objective

Clean, accessible, production-ready music platform.

| Priority | Area |
|----------|------|
| 1 | Functional correctness |
| 2 | Accessibility (WCAG 2.2 AA) |
| 3 | Performance |
| 4 | Maintainability |
| 5 | Cross-surface consistency |
| 6 | Honest implementation (no fake production) |

## Vertical slice rule

For every task, complete a **full vertical slice**:

- Backend logic
- Frontend integration (web + mobile when user-facing)
- API wiring
- Error + loading states
- Edge cases
- Accessibility
- Basic performance

Stop only when the feature is wired end-to-end with no stub required for core use.

## Multi-system checklist

When touching a feature, check:

- API · DB · Web UI · Mobile · Worker · A11y

## Required session output (7-part)

1. What was changed  
2. Why it was needed  
3. Files modified  
4. What is still incomplete  
5. How to test it  
6. Accessibility check  
7. Next improvement opportunity  

## Related

- `docs/ENCORE-MULTI-AGENT-PRODUCTION.md` — corporate divisions  
- `docs/ENCORE-HIGH-PERFORMANCE-PROMPTS.md` — copy-paste prompt pack  
- `docs/ACCESSIBILITY.md` — WCAG baseline  
- `.cursor/rules/encore-corporation.mdc` — always-on  
