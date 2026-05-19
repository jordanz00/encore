# Role 10 — Self-Host vs SaaS

## Mission
Encore is AGPL-3.0; the dual operating model is non-negotiable: anyone can run it themselves, *and* we run a hosted SaaS tier. The job of this role is to keep the same codebase honest for both — a "small server" single-binary mode for indie hosts, a Helm chart for ops teams, and a multi-tenant SaaS cluster mode for our hosted offering — without forking the code, the schema (`packages/db/src/schema.ts`), or the audio pipeline (`apps/worker/src/jobs/transcode.ts`).

## Current Decision
Three deployment profiles, one repo:

1. **Small server (single binary).** Bundles `apps/api`, `apps/worker`, the Next.js `apps/web` build, and embedded SQLite + DuckDB into one launcher that orchestrates the Node processes. Storage backend is local-filesystem by default (S3-compatible if configured). Target: a karaoke bar, a campus radio, an indie label runs Encore on a $5/mo VPS.
2. **Self-host k8s.** Helm chart in `infra/helm/` (currently empty) installs Postgres, Redis, MinIO, Meilisearch, the API, the worker fleet, and a single-replica Next.js web app. Same env contract as `infra/docker/docker-compose.yml`. Storage backend pluggable: local, MinIO, S3, R2, Backblaze B2.
3. **SaaS multi-tenant cluster.** Same images, same schema, but with a `tenant_id` column on every public table (added in a v0.1 migration), Postgres logical replication for read replicas, and a per-tenant key prefix in S3. ClickHouse warehouse (Role 08) is shared with `tenantId` as a primary partition key.

## Why this Choice
- **One codebase** keeps the AGPL covenant honest: the SaaS tier doesn't get a private feature branch.
- **Single binary** is the only way an indie operator actually self-hosts. Docker Compose is too many moving parts; the embedded mode trades scale for "it just works on a Raspberry Pi 5."
- **Helm** matches the audience (ops teams running on EKS / GKE / on-prem k8s) without forcing every self-hoster onto k8s.
- **`tenant_id` in `packages/db/src/schema.ts`** keeps multi-tenant logic in row-level security policies, not application code, so a contributor can't accidentally leak data across tenants.

## Trade-offs
- **Single binary** can't run the binaural / spatial-audio (RFC 003) render or the full HLS ladder at scale; we run a reduced pipeline (one rung, no spatial) and document the limit in the README.
- **Per-tenant S3 key prefix** simplifies billing and deletion but complicates CDN signing (Role 09) — the path schema differs from the self-host single-tenant default.
- **Pluggable storage** means more code paths to test; we keep a single `StorageDriver` interface and run the same suite against local FS, MinIO, and AWS S3 in CI.
- **Helm chart maintenance** is its own job; we tag chart versions independently from app versions to avoid forcing self-hosters into our release cadence.
- **SQLite vs Postgres** in the small-binary mode: SQLite skips multi-tenancy and concurrent-write performance; we cap small-server mode at one tenant and document the migration path to Postgres.

## Performance & Scale Targets
- **Small server:** plays a track on a 1 vCPU / 1 GB RAM box with **< 200 ms cold-start**; supports up to **1 000 tracks** and **50 simultaneous listeners**.
- **Self-host k8s:** the chart's default values run a 5-node cluster (1 API, 2 workers, 1 web, shared infra); supports **100 000 tracks** and **5 000 simultaneous listeners**.
- **SaaS multi-tenant cluster:** **10 000 tenants** on one logical schema before sharding; per-tenant noisy-neighbor isolation via Postgres connection-pool limits and BullMQ queue prefixes.
- **Migration safety:** any schema change in `packages/db/src/schema.ts` must be backwards-compatible for two minor versions so a self-hoster who upgrades quarterly never hits a forced-downtime window.

## Open Questions
- Single-binary launcher: Bun (carries Node-compat tax), Deno Compile, or a custom Go wrapper that spawns Node?
- Ship the Helm chart in v0.1, or wait until the docker-compose path is fully polished?
- Multi-tenant SaaS: hard-isolate (separate DB per tenant for premium plans) or stay on shared schema with row-level security?
- Self-hosters: offer a "managed updates" channel (auto-pull new container tags) or always require manual `helm upgrade`?
- Telemetry: opt-in anonymous usage stats from self-hosters so we can prioritize fixes — privacy posture vs product clarity?
