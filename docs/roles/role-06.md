# Role 06 — Tech Stack RFC Owner

## Mission
Own the cross-cutting "is this still the right tool?" review for Encore's foundational stack. Convert vibes ("everyone uses X") into written RFCs with measurable acceptance criteria, then drive the decision to a merged file under `docs/rfcs/` so a contributor who joins in month nine can read why we picked Fastify over Hono, Postgres + pgvector over a separate vector DB, and Tauri 2 over Electron — without re-litigating the choice in PR threads. Keep defaults defensible; replace them only when a benchmark or operational story justifies the migration cost.

## Current Decision
Validate (not relitigate) the stack already wired into the monorepo:

- **HTTP runtime:** Fastify 4 in `apps/api/src/server.ts`, not Hono or Express.
- **Primary DB:** Postgres 16 with `pgvector` (`infra/docker/docker-compose.yml` runs `pgvector/pgvector:pg16`); schema in `packages/db/src/schema.ts`.
- **Vector store:** Same Postgres instance (`embedding vector(1024)` on `tracks` in `packages/db/src/schema.ts`). No Pinecone / Weaviate / Qdrant dependency.
- **Search:** Meilisearch v1.10 (`infra/docker/docker-compose.yml`), not Typesense or Elastic.
- **Desktop shell:** Tauri 2 (`apps/desktop/`), not Electron.

Each gets its own follow-up RFC if a re-evaluation is triggered.

## Why this Choice
- **Fastify** has first-class TypeScript types, an integrated Zod-friendly validation pipeline (already in use in `apps/api/src/routes/uploads.ts`), and the lowest-overhead plugin model among Node options. We share Zod schemas with the worker, which makes Hono's web-standard ergonomics nice but redundant.
- **Postgres + pgvector** is one operational story instead of two. A 1024-dim embedding column on `tracks` (RFC 004) joins naturally to artist, release, and play tables; `hnsw` indexes scale comfortably to ~50M rows. Self-hosters (Role 10) run one DB instead of two.
- **Meilisearch** ships typo-tolerant relevance out of the box, has a tiny ops footprint compared to Elastic, and (unlike Typesense) is friendly with our AGPL self-host story.
- **Tauri 2** gives us a ~10× smaller binary than Electron, native OS menus, and Rust sidecars for protected-content paths if we ship them later.

## Trade-offs
- **Fastify:** smaller plugin ecosystem than Express; some Node libraries assume Express `req`/`res`. Mitigated by Fastify's compat layer.
- **pgvector** loses to a dedicated vector store above ~10M dense vectors at high QPS; the migration is documented in RFC 004 with a clean DataLayer abstraction so the cutover is a config flip.
- **Meilisearch:** weaker faceted aggregation than Elastic, no nested join. Acceptable for tracks/artists/playlists; Elastic re-evaluation gated on a podcast-scale corpus.
- **Tauri 2:** smaller community than Electron; fewer plug-and-play media bridges. We accept maintenance cost for the bundle-size and security wins.

## Performance & Scale Targets
- API p99 latency: < 80 ms for cached reads, < 250 ms for warm DB reads, measured per route under `apps/api/src/routes/`.
- Postgres OLTP working set fits in RAM up to 10M tracks; vector top-50 returns in < 30 ms with `hnsw` (RFC 004).
- Meilisearch p95 query latency < 50 ms across the unified `tracks-artists-playlists` index up to 5M docs.
- Desktop app cold-start < 1.5 s, RSS < 200 MB at idle on a 2020 MacBook Air.
- Each major rev (Fastify 5, pgvector successor, Meilisearch 2) gets a benchmark run before bumping; the result lands in the RFC as the migration justification.

## Open Questions
- Do we adopt Fastify 5 the moment it ships, or wait one minor for plugins to catch up?
- pgvector vs `pgvecto.rs` / `pg_lance` — re-bench at the 10M-vector mark; same row, different index.
- Replace Meilisearch with Typesense if a hosted-search SaaS tier becomes a product?
- Should the RFC owner role rotate quarterly so no single contributor becomes a stack bottleneck?
- Bun for the API runtime — at what point does the perf gap stop being theoretical?
