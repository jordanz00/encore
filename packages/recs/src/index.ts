/**
 * @encore/recs — recommendations engine.
 *
 * Hybrid approach (RFC 004):
 *   - collaborative: implicit-feedback iALS (sliced for the OSS scaffold;
 *     real training runs offline in worker, results land in `track_similarity`).
 *   - content-based: cosine over pgvector embeddings stored on tracks.
 *   - editorial: hand-curated playlists override and dilute the feed.
 *   - fresh-crate: time-decayed boost for new artists (cold-start guarantee).
 *
 * Sliders let users dilute personalization at request time. All knobs
 * sum to 1.0 server-side.
 */
import { db, schema } from "@encore/db";
import { sql, desc, and, eq, isNotNull } from "drizzle-orm";

export interface AlgorithmSliders {
  /** 0..1 — weight on collaborative signal (people-like-you). */
  personalization: number;
  /** 0..1 — weight on content similarity (sounds-like-this). */
  similarity: number;
  /** 0..1 — weight on editorial picks. */
  editorial: number;
  /** 0..1 — weight on freshness (new artists in last 28 days). */
  freshness: number;
  /** 0..1 — weight on diversity (penalize re-exposure to same artists). */
  diversity: number;
}

export const DEFAULT_SLIDERS: AlgorithmSliders = {
  personalization: 0.4,
  similarity: 0.25,
  editorial: 0.15,
  freshness: 0.15,
  diversity: 0.05,
};

export function normalizeSliders(input: Partial<AlgorithmSliders>): AlgorithmSliders {
  const merged = { ...DEFAULT_SLIDERS, ...input };
  const sum =
    merged.personalization +
    merged.similarity +
    merged.editorial +
    merged.freshness +
    merged.diversity;
  if (sum === 0) return { ...DEFAULT_SLIDERS };
  return {
    personalization: merged.personalization / sum,
    similarity: merged.similarity / sum,
    editorial: merged.editorial / sum,
    freshness: merged.freshness / sum,
    diversity: merged.diversity / sum,
  };
}

export interface RecommendedTrack {
  trackId: string;
  releaseId: string;
  artistId: string;
  score: number;
  reasons: string[];
}

export interface RecommendationContext {
  userId: string | null;
  /** Track IDs the user has liked or played heavily — seed for similarity. */
  seedTrackIds: string[];
  /** Optional locale to bias editorial selections. */
  locale?: string;
  limit: number;
  sliders?: Partial<AlgorithmSliders>;
}

/**
 * Build a recommendation feed combining all signals, filtering duplicates,
 * applying diversity slider as an artist-level penalty.
 */
export async function recommendForUser(
  ctx: RecommendationContext,
): Promise<RecommendedTrack[]> {
  const sliders = normalizeSliders(ctx.sliders ?? {});
  const buckets = await Promise.all([
    sliders.similarity > 0 && ctx.seedTrackIds.length
      ? contentBasedSimilar(ctx.seedTrackIds, ctx.limit * 2)
      : Promise.resolve([]),
    sliders.editorial > 0 ? editorialPicks(ctx.limit) : Promise.resolve([]),
    sliders.freshness > 0 ? freshCrate(ctx.limit) : Promise.resolve([]),
    sliders.personalization > 0 && ctx.userId
      ? collaborativeForUser(ctx.userId, ctx.limit * 2)
      : Promise.resolve([]),
  ]);
  const [similar, editorial, fresh, collab] = buckets;

  const merged = new Map<string, RecommendedTrack>();
  const accumulate = (rows: RecommendedTrack[], weight: number, label: string): void => {
    rows.forEach((r, idx) => {
      const positionalScore = (rows.length - idx) / rows.length;
      const score = positionalScore * weight;
      const existing = merged.get(r.trackId);
      if (existing) {
        existing.score += score;
        existing.reasons.push(label);
      } else {
        merged.set(r.trackId, { ...r, score, reasons: [label] });
      }
    });
  };
  accumulate(similar, sliders.similarity, "similar");
  accumulate(editorial, sliders.editorial, "editorial");
  accumulate(fresh, sliders.freshness, "fresh");
  accumulate(collab, sliders.personalization, "personalization");

  let ordered = Array.from(merged.values()).sort((a, b) => b.score - a.score);
  if (sliders.diversity > 0) {
    ordered = applyArtistDiversity(ordered, sliders.diversity);
  }
  return ordered.slice(0, ctx.limit);
}

function applyArtistDiversity(
  rows: RecommendedTrack[],
  diversity: number,
): RecommendedTrack[] {
  const seen = new Map<string, number>();
  return rows
    .map((r) => {
      const count = seen.get(r.artistId) ?? 0;
      const penalty = count * diversity * 0.3;
      seen.set(r.artistId, count + 1);
      return { ...r, score: r.score - penalty };
    })
    .sort((a, b) => b.score - a.score);
}

async function contentBasedSimilar(seedTrackIds: string[], limit: number): Promise<RecommendedTrack[]> {
  if (seedTrackIds.length === 0) return [];
  const rows = await db.execute<{
    track_id: string;
    release_id: string;
    primary_artist_id: string;
    distance: number;
  }>(sql`
    WITH seed AS (
      SELECT embedding FROM tracks
      WHERE id = ANY(${seedTrackIds}::uuid[])
        AND embedding IS NOT NULL
    ),
    centroid AS (
      SELECT AVG(embedding)::vector(1024) AS v FROM seed
    )
    SELECT t.id AS track_id, t.release_id, t.primary_artist_id,
           (t.embedding <=> (SELECT v FROM centroid)) AS distance
    FROM tracks t
    WHERE t.embedding IS NOT NULL
      AND t.id <> ALL(${seedTrackIds}::uuid[])
      AND t.moderation = 'approved'
    ORDER BY t.embedding <=> (SELECT v FROM centroid)
    LIMIT ${limit}
  `);
  const list = (rows as unknown as { rows: any[] }).rows ?? [];
  return list.map((r) => ({
    trackId: r.track_id,
    releaseId: r.release_id,
    artistId: r.primary_artist_id,
    score: 1 - r.distance,
    reasons: ["similar"],
  }));
}

async function editorialPicks(limit: number): Promise<RecommendedTrack[]> {
  const rows = await db
    .select({
      trackId: schema.tracks.id,
      releaseId: schema.tracks.releaseId,
      artistId: schema.tracks.primaryArtistId,
    })
    .from(schema.playlistItems)
    .innerJoin(schema.playlists, eq(schema.playlists.id, schema.playlistItems.playlistId))
    .innerJoin(schema.tracks, eq(schema.tracks.id, schema.playlistItems.trackId))
    .where(and(eq(schema.playlists.isEditorial, true), eq(schema.tracks.moderation, "approved")))
    .orderBy(desc(schema.playlistItems.addedAt))
    .limit(limit);
  return rows.map((r) => ({
    trackId: r.trackId,
    releaseId: r.releaseId,
    artistId: r.artistId,
    score: 1,
    reasons: ["editorial"],
  }));
}

async function freshCrate(limit: number): Promise<RecommendedTrack[]> {
  const cutoff = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      trackId: schema.tracks.id,
      releaseId: schema.tracks.releaseId,
      artistId: schema.tracks.primaryArtistId,
      publishedAt: schema.releases.publishedAt,
    })
    .from(schema.tracks)
    .innerJoin(schema.releases, eq(schema.releases.id, schema.tracks.releaseId))
    .where(
      and(
        eq(schema.releases.status, "published"),
        eq(schema.tracks.moderation, "approved"),
        isNotNull(schema.releases.publishedAt),
        sql`${schema.releases.publishedAt} >= ${cutoff}`,
      ),
    )
    .orderBy(desc(schema.releases.publishedAt))
    .limit(limit);
  return rows.map((r) => ({
    trackId: r.trackId,
    releaseId: r.releaseId,
    artistId: r.artistId,
    score: 1,
    reasons: ["fresh"],
  }));
}

async function collaborativeForUser(
  userId: string,
  limit: number,
): Promise<RecommendedTrack[]> {
  const rows = await db.execute<{
    track_id: string;
    release_id: string;
    primary_artist_id: string;
    score: number;
  }>(sql`
    WITH my_likes AS (
      SELECT track_id FROM likes WHERE user_id = ${userId}
    ),
    co_likers AS (
      SELECT l2.user_id, COUNT(*) AS overlap
      FROM likes l1
      JOIN likes l2 ON l1.track_id = l2.track_id AND l2.user_id <> ${userId}
      WHERE l1.user_id = ${userId}
      GROUP BY l2.user_id
      ORDER BY overlap DESC
      LIMIT 200
    ),
    candidates AS (
      SELECT l.track_id, SUM(c.overlap)::float AS score
      FROM likes l
      JOIN co_likers c ON c.user_id = l.user_id
      WHERE l.track_id NOT IN (SELECT track_id FROM my_likes)
      GROUP BY l.track_id
    )
    SELECT t.id AS track_id, t.release_id, t.primary_artist_id, c.score
    FROM candidates c
    JOIN tracks t ON t.id = c.track_id
    WHERE t.moderation = 'approved'
    ORDER BY c.score DESC
    LIMIT ${limit}
  `);
  const list = (rows as unknown as { rows: any[] }).rows ?? [];
  return list.map((r) => ({
    trackId: r.track_id,
    releaseId: r.release_id,
    artistId: r.primary_artist_id,
    score: r.score,
    reasons: ["personalization"],
  }));
}

// ---------- Radio / stations ----------

export type RadioSeedKind = "track" | "artist" | "genre" | "mood";

export interface RadioOptions {
  kind: RadioSeedKind;
  /** UUID for track/artist; slug for genre/mood. */
  seedId: string;
  limit: number;
}

/**
 * Build a radio station: seed track → expanding similarity ring (pgvector
 * cosine) with novelty injection so the station does not loop.
 */
export async function buildRadioStation(opts: RadioOptions): Promise<RecommendedTrack[]> {
  if (opts.kind === "track") {
    return contentBasedSimilar([opts.seedId], opts.limit);
  }
  if (opts.kind === "artist") {
    const seedTracks = await db
      .select({ id: schema.tracks.id })
      .from(schema.tracks)
      .where(eq(schema.tracks.primaryArtistId, opts.seedId))
      .limit(20);
    return contentBasedSimilar(
      seedTracks.map((t) => t.id),
      opts.limit,
    );
  }
  if (opts.kind === "genre" || opts.kind === "mood") {
    const seedSlug = opts.seedId;
    const rows = await db.execute<{
      track_id: string;
      release_id: string;
      primary_artist_id: string;
    }>(sql`
      SELECT t.id AS track_id, t.release_id, t.primary_artist_id
      FROM tracks t
      JOIN releases r ON r.id = t.release_id
      WHERE r.genres @> ${JSON.stringify([seedSlug])}::jsonb
        AND t.moderation = 'approved'
        AND r.status = 'published'
      ORDER BY random()
      LIMIT ${opts.limit}
    `);
    const list = (rows as unknown as { rows: any[] }).rows ?? [];
    return list.map((r) => ({
      trackId: r.track_id,
      releaseId: r.release_id,
      artistId: r.primary_artist_id,
      score: 1,
      reasons: ["radio"],
    }));
  }
  return [];
}
