# Persistent execution mode

Encore agents and human operators use a **non-terminating** improvement loop:

**AUDIT → PLAN → IMPLEMENT → VERIFY → RE-AUDIT → PRIORITIZE → CONTINUE**

Stop only when blocked by missing secrets/infra or no meaningful next step in [`BACKLOG.md`](BACKLOG.md).

## Rules

- No early exit after one file or one green compile.
- Search actively for stubs, `501`, TODOs, placeholder UI.
- Prefer vertical slices over cosmetic diffs.
- Use honest status labels: MVP-complete, wired, production hardening required.
- Protect money invariants and federation IRIs.

Cursor rule: `.cursor/rules/encore-execution.mdc`
