# Role 08 — Database + Warehouse

## Mission
Run two databases that don't get confused with each other: the **OLTP Postgres** that backs every read/write the API does, and the **analytics warehouse** (ClickHouse first, DuckDB for embedded / self-host) that answers "how many plays did this track get last Tuesday in Germany." Keep `packages/db/src/schema.ts` the single source of truth for OLTP; keep aggregate truth in the warehouse. Recommendations, podcast feeds, federation outbox, sales — all OLTP, with clean table boundaries.

## Current Decision
- **OLTP:** Postgres 16 (`pgvector/pgvector:pg16` per `infra/docker/docker-compose.yml`), schema in `packages/db/src/schema.ts`. Drizzle ORM, migrations under `infra/migrations/`.
- **Vector:** `embedding vector(1024)` on `tracks` (`packages/db/src/schema.ts` ~line 325). Indexed with `hnsw` on `vector_cosine_ops` for content-based recs (RFC 004).
- **Plays partitioning:** the `plays` table (`packages/db/src/schema.ts` ~lines 484–506) is **range-partitioned by `playedAt` monthly**, with rolling indexes on `(trackId, playedAt)` and `(userId, playedAt)`. Aggregate truth lives in `track_play_counters` (same file), updated by the worker and not by triggers.
- **Analytics:** ClickHouse cluster receives a CDC feed of `plays` and `sales` once per minute. DuckDB ships in the self-host single-binary build (Role 10) for sub-million-row deployments without a ClickHouse dependency.
- **Hot/cold:** `plays` partitions older than 24 months move to compressed Parquet on object storage and are queried via DuckDB's `httpfs` extension.

## Why this Choice
- **One OLTP** is operationally cheap; `pgvector` keeps recs join-friendly with `tracks`, `artists`, `releases` so "more like this" is one SQL statement.
- **ClickHouse** wins the play-counts/per-country/per-day workload: columnar store, native time-series, and DSR-class definitions (RFC 002) translate cleanly to materialized views.
- **DuckDB** lets a self-hoster (Role 10) run the same SQL we run in production without standing up a second service.
- **Monthly range partitions on `plays`** match how DSR reports are produced (per month) and make `DROP PARTITION` the answer for retention.

## Trade-offs
- **pgvector at 50M+ vectors** loses to a dedicated vector store on QPS-per-dollar; the migration is documented in RFC 004 with a clean DataLayer abstraction so the cutover is one config change, not a rewrite.
- **CDC into ClickHouse** adds operational surface (Debezium, Kafka Connect, or a homegrown logical-replication consumer); we ship it behind a feature flag in v1.
- **Partitioning the plays table** complicates secondary indexes and uniqueness constraints; the privacy-respecting design (no detailed plays for users with `disableDetailedPlayTracking = true`, per `packages/db/src/schema.ts`) keeps row volume manageable.
- **Soft-delete via `deletedAt`** is consistent across `users`, `artists`, `releases`, `tracks` but means most read queries must remember to filter — addressed by a Drizzle scope (TBD).

## Performance & Scale Targets
- Postgres p99 read **< 5 ms** for primary-key fetches, **< 25 ms** for indexed range scans.
- `plays` insert sustained **10 000 writes/s** without lock contention thanks to monthly partitioning + UUID v7 IDs.
- Vector top-50 query **p95 < 30 ms** up to 10M tracks (`hnsw`, `m=16, ef_construction=64`).
- ClickHouse "plays last 30d by country for this artist" **p95 < 200 ms**.
- Self-host DuckDB rollup of "top 100 tracks of last week" **< 2 s** on 1M-play datasets.
- Monthly partition rotation completes in < 60 s with no read-side blocking.

## Open Questions
- UUID v4 (current default) vs UUID v7 for `plays.id` — v7's monotonic prefix would help BRIN indexes; how much does it matter at our volume?
- Logical replication vs Debezium for CDC — pick one before v1 or ship both behind a flag?
- Publish a "DSR-ready" materialized view directly from ClickHouse, or generate DSR through a dedicated worker job (RFC 002)?
- Retention policy for raw `plays` — 24 months as default, or per-tenant override for self-hosters with regulatory requirements?
- Do we add a separate `plays_aggregated_daily` table in OLTP for the artist-dashboard hot path, or always read ClickHouse?
