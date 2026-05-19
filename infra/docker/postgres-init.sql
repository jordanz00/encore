-- Encore Postgres bootstrap.
-- pgvector is required for content-based recommendations (audio embeddings).
-- pg_trgm helps with fuzzy artist/track name matching as a Meilisearch fallback.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;
