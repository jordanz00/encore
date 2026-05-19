# RFC 001 — Tech Stack

## Status
**Accepted (provisional)** — 2026-05. Validates the stack already wired up in the monorepo. Open items below are non-blocking and tracked individually.

## Context
Encore is a multi-surface music platform: a Next.js web app at `apps/web/`, a Fastify HTTP API at `apps/api/`, a BullMQ worker fleet at `apps/worker/`, an admin app at `apps/admin/`, an Expo mobile app at `apps/mobile/`, and a Tauri 2 desktop shell at `apps/desktop/`. Shared packages (`packages/db`, `packages/audio`, `packages/player`, `packages/sdk`, `packages/ui`, `packages/config`) glue them together. The data tier is Postgres + Drizzle + pgvector (schema in `packages/db/src/schema.ts`), a Redis instance for queues and caches, MinIO / S3 for object storage, and Meilisearch for full-text search. Infra lives in `infra/docker/` and `infra/helm/`.

The stack was chosen to optimise for: (1) one TypeScript codebase end-to-end, (2) AGPL-3.0-friendly dependencies, (3) small binaries on the desktop, (4) a path off any single vendor (S3 ↔ MinIO, Stripe ↔ alt processors, Meilisearch ↔ Postgres trigram), (5) honest performance under indie-scale load (thousands of concurrent listeners, not millions on day one).

This RFC validates each major choice against its real alternatives and writes the trade-offs down so future contributors can challenge them.

## Decision

### Web — Next.js 15 (App Router) + React 19 RC
**Keep.** Next.js gives us SSR for SEO on artist / track / release pages, route-segmented bundles, the new server components story for editorial pages, and a healthy ecosystem (`apps/web/package.json` already pins `next 15.0.3`, `react 19.0.0-rc`, `wavesurfer.js`, `hls.js`). Alternatives considered: Remix (excellent, but smaller plugin gravity for media components); SvelteKit (smaller team, leaner runtime, but loses code reuse with React Native in `apps/mobile/`); plain Vite + React Router (more wiring, no SSR by default).

### API — Fastify 4
**Keep.** Fastify is the fastest mainstream Node HTTP framework, has first-class plugin encapsulation (`@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/multipart`, `@fastify/cookie`, `@fastify/sensible` — all already wired in `apps/api/src/server.ts`), supports Zod schema validation through `fastify-type-provider-zod`, and integrates cleanly with Pino logging.

Alternatives:
- **Hono.** Faster on edge runtimes, leaner middleware, but the Node ecosystem (multipart, rate limiting, helmet, file uploads at gigabyte scale) is thinner than Fastify's. Multipart streaming with backpressure to S3 / MinIO matters for our 1 GiB master upload ceiling.
- **Express.** Largest ecosystem, but slower, no built-in schema validation, middleware ordering footguns, and the maintenance posture of the project is lukewarm.
- **NestJS.** Strong DI / OpenAPI ergonomics, but the abstraction overhead is meaningful and we don't need an enterprise-y module system.

Outcome: **Fastify**, with the option to extract route handlers behind a thin wrapper if we ever need to migrate. The current handler signature (`async function handler(req, reply)`) is portable.

### Database — Postgres 16 + Drizzle + pgvector
**Keep.** Drizzle gives us SQL-shaped TypeScript without the runtime cost or the leaky abstractions of an ORM. The schema in `packages/db/src/schema.ts` (~735 LOC, custom `vector(1024)` type, GIN trigram indexes on `tracks.title` and `artists.name`, soft deletes, federation columns, full enums) is realistic; switching to Prisma would force schema drift between the Prisma DSL and the SQL we actually want.

Alternatives:
- **Prisma.** Better dashboard / migrate UX, slower runtime, weaker raw-SQL story, weaker pgvector support, harder to express the trigram GIN indexes we already use. Migration assistant is nice; not worth the runtime tax.
- **Kysely.** Excellent type-safe SQL builder; close call. Drizzle wins on schema-as-source-of-truth (`schema.ts` doubles as documentation) and on the `drizzle-kit` migration generation we already run from `packages/db/`.
- **TypeORM / Sequelize.** Rejected — both carry historical correctness issues we don't want to inherit.

### Background jobs — BullMQ + Redis
**Keep.** BullMQ is the de-facto Node job queue: retries, scheduled jobs, rate-limited workers, group concurrency. Used in `apps/worker/` and re-exported via `apps/api/src/lib/queue.ts`. Alternatives (Inngest, Temporal, pg-boss, Cloudflare Queues) are credible; BullMQ is the simplest path that doesn't tie us to a vendor. pg-boss would let us drop Redis but pays for it in throughput on busy queues (transcode, ingest, recommendation refresh).

### Object storage — MinIO (dev / self-host) ↔ S3-compatible (prod)
**Keep.** `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` are already pinned in `apps/api/package.json`. MinIO covers `infra/docker/`; production can run on AWS S3, Cloudflare R2, Backblaze B2, or a local MinIO cluster without code changes. Master uploads, HLS playlists, FLAC progressives, waveform JSON, cover art, and avatars all live on the same interface.

### Search — Meilisearch
**Keep, with Postgres trigram fallback.** Meilisearch ships fast typo-tolerant search out of the box and federates well with Postgres for ranking signals. The `pg_trgm` GIN indexes already on `tracks` and `artists` (see `packages/db/src/schema.ts`) are a credible read-only fallback for self-hosters who don't want a second daemon.

### Mobile — Expo (managed → bare)
**Keep.** Single TypeScript codebase shared with the web SDK in `packages/sdk/`. Bare workflow gates only at the point CarPlay / AAuto force native modules (Role 17, Role 19). React Native CLI bare-from-day-one trades faster native iteration for slower setup and weaker OTA story; not worth it for a v1 we want to keep moving on.

### Desktop — Tauri 2
**Keep.** Tauri 2 produces ~5–15 MB installers vs Electron's ~150 MB+, with a Rust shell over the existing Next.js bundle (`apps/desktop/`). Trade-off: smaller plugin universe than Electron and a few rough edges (MPRIS2 plugin maturity on Linux, Mac App Store sandbox profile) flagged in Role 18. The bundle size, memory footprint, and native-feel wins are real.

## Alternatives considered (summary)

| Layer | Chosen | Runner-up | Why we picked the chosen |
|---|---|---|---|
| Web | Next.js 15 | Remix | SSR + plugin gravity + React reuse w/ mobile |
| API | Fastify 4 | Hono | Mature Node middleware ecosystem at scale |
| ORM | Drizzle | Kysely | Schema is the source of truth; pgvector first-class |
| DB | Postgres 16 + pgvector | — | Recs require pgvector |
| Queue | BullMQ + Redis | pg-boss | Throughput on transcode / ingest |
| Storage | S3 / MinIO | Garage / SeaweedFS | Mature SDK, drop-in cloud or self-host |
| Search | Meilisearch | Typesense | Self-hostability + simpler ops |
| Mobile | Expo | RN bare CLI | Faster v1; bare workflow when CarPlay forces it |
| Desktop | Tauri 2 | Electron | 10× smaller binary, lower RAM |

## Consequences

**Positive.**
- One language across all apps and packages.
- AGPL-clean dependency tree (no closed kernels).
- Self-hostable from a single docker-compose at `infra/docker/`.
- Drizzle schema doubles as living documentation.
- pgvector + 1024-dim audio embeddings unlock `docs/rfcs/004-recommendations.md` without a separate vector DB.
- Tauri keeps the desktop install honest at sub-15 MB.

**Negative.**
- React 19 RC is a moving target for v1; pinning versions in `apps/web/package.json` is mandatory.
- Drizzle's tooling is younger than Prisma's; some IDE niceties are missing.
- Tauri 2 plugin maturity (MPRIS2 / mini-player) is uneven; Role 18 absorbs the work.
- BullMQ requires Redis in production — a non-trivial op for self-hosters; we publish a "small instance" profile (queue.ts can fall back to in-process for dev) and document pg-boss as a future option.
- Expo bare migration is mandatory once CarPlay (Role 19) ships.

## Open Questions
- Do we ship a `pg-boss`-backed alternative queue driver behind the `apps/api/src/lib/queue.ts` interface for self-hosters who refuse Redis?
- React 19 stable timing — do we keep the RC pin or hold web on 18.3 until 19.x stable lands?
- Drizzle migration strategy at scale — current `drizzle-kit generate` flow is fine for v1; do we add a separate squash / baseline step before the first public release?
- Search: stay on Meilisearch, or evaluate Typesense / Postgres-only once we have real query mix data?
- Tauri 2 + Mac App Store: confirmed sandbox profile or Direct DMG only for v1?
