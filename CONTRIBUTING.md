# Contributing to Encore

Thanks for considering a contribution. Encore is a community-run open-source music platform; every patch matters.

## Ground rules

1. **Be excellent to each other.** Read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Reports go to `conduct@encore.audio`.
2. **DCO sign-off on every commit.** Use `git commit -s` so each commit ends with `Signed-off-by: Your Name <you@example.com>`. No separate CLA required.
3. **Small, focused PRs.** Easier to review, easier to merge.
4. **No invented data.** Don't add statistics, claims, or stat lookups without a source. If you're unsure, flag it for review.
5. **Discuss large changes first.** Open a Discussion or RFC under `docs/rfcs/` before writing >500 lines of architectural code.

## Getting started

1. Fork and clone.
2. Follow the [README quick start](README.md#quick-start-local-dev).
3. Pick an issue tagged `good first issue` or open one yourself.
4. Branch from `main`: `git checkout -b feat/short-slug`.
5. Make changes. Add or update tests. Update docs if you touched a documented behavior.
6. `pnpm typecheck && pnpm lint && pnpm test` should all pass.
7. Push and open a PR. Reference the issue number.

## Commit messages

Conventional Commits when convenient — not enforced.

```
feat(api): add /releases search by genre
fix(worker): retry transcode on intermittent S3 timeout
docs(rfcs): clarify EBU R128 default in RFC 003
chore(deps): bump drizzle-orm to 0.36.x
```

Subject ≤ 50 chars where possible. Body answers *why* before *what*.

## Architecture decisions

Significant architectural changes go through an RFC. Process:

1. Copy `docs/rfcs/_template.md` (TODO: add) to `docs/rfcs/NNN-short-slug.md`.
2. Fill in Status / Context / Decision / Alternatives / Consequences / Open Questions.
3. Open a draft PR; the discussion happens there.
4. Minimum 7 days open for community review before merge.
5. Merge requires maintainer-council majority (or BDFL approval pre-Phase-2).

See [GOVERNANCE.md](GOVERNANCE.md) for the full process.

## Coding standards

- **TypeScript strict mode** everywhere except the desktop Rust shell.
- **No `any`.** If you need it, document why in a code comment.
- **Public functions documented.** JSDoc for exported APIs; describe what + why, not how.
- **No new top-level dependencies without justification.** Bigger surface area = bigger maintenance + security review.
- **Schema changes in `packages/db/src/schema.ts` ship with a migration.** Generate via `pnpm --filter @encore/db generate`.

## Testing

- Unit tests live next to source (`*.test.ts`).
- Integration tests live under `tests/` per-app.
- Audio pipeline changes (`apps/worker/src/jobs/transcode.ts`) require a sample WAV fixture; commit the fixture under `tests/fixtures/`.

## Security

If you find a vulnerability, **do not open a public issue**. Email `security@encore.audio` privately. See [SECURITY.md](SECURITY.md).

## Documentation

- User-facing docs: in the relevant app's README.
- Contributor docs: `docs/`.
- Field-level data dictionary: `packages/db/src/schema.ts` JSDoc comments + `docs/data-dictionary.md` (TODO).

## Recognition

Contributors are listed in `CONTRIBUTORS.md` (auto-updated). Significant contributors may be invited to the maintainer council per the [governance roadmap](GOVERNANCE.md).

Thank you for helping build something better.
