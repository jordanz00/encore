/**
 * Postgres ILIKE search when Meilisearch is down or unindexed.
 * Published releases only; excludes soft-deleted rows.
 */
import { db, schema } from "@encore/db";
import { and, eq, ilike, isNull, or } from "drizzle-orm";
import type {
  SearchArtistHit,
  SearchReleaseHit,
  SearchTrackHit,
} from "./search-types.js";

function escapeLike(q: string): string {
  return q.replace(/[%_\\]/g, (c) => `\\${c}`);
}

export async function searchPostgres(q: string): Promise<{
  artists: SearchArtistHit[];
  releases: SearchReleaseHit[];
  tracks: SearchTrackHit[];
}> {
  const pattern = `%${escapeLike(q)}%`;

  const artists = await db
    .select({
      id: schema.artists.id,
      name: schema.artists.name,
      slug: schema.artists.slug,
    })
    .from(schema.artists)
    .where(
      and(
        isNull(schema.artists.deletedAt),
        or(
          ilike(schema.artists.name, pattern),
          ilike(schema.artists.slug, pattern),
        ),
      ),
    )
    .limit(8);

  const releaseRows = await db
    .select({
      id: schema.releases.id,
      title: schema.releases.title,
      type: schema.releases.type,
      coverArtKey: schema.releases.coverArtKey,
      primaryArtistName: schema.artists.name,
      primaryArtistSlug: schema.artists.slug,
    })
    .from(schema.releases)
    .innerJoin(schema.artists, eq(schema.releases.primaryArtistId, schema.artists.id))
    .where(
      and(
        eq(schema.releases.status, "published"),
        isNull(schema.releases.deletedAt),
        ilike(schema.releases.title, pattern),
      ),
    )
    .limit(12);

  const trackRows = await db
    .select({
      id: schema.tracks.id,
      title: schema.tracks.title,
      releaseId: schema.tracks.releaseId,
      releaseTitle: schema.releases.title,
      primaryArtistName: schema.artists.name,
      durationMs: schema.tracks.durationMs,
    })
    .from(schema.tracks)
    .innerJoin(schema.releases, eq(schema.tracks.releaseId, schema.releases.id))
    .innerJoin(schema.artists, eq(schema.tracks.primaryArtistId, schema.artists.id))
    .where(
      and(
        eq(schema.releases.status, "published"),
        isNull(schema.tracks.deletedAt),
        isNull(schema.releases.deletedAt),
        ilike(schema.tracks.title, pattern),
      ),
    )
    .limit(20);

  return {
    artists,
    releases: releaseRows.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      coverArtKey: r.coverArtKey,
      primaryArtistName: r.primaryArtistName,
      primaryArtistSlug: r.primaryArtistSlug,
    })),
    tracks: trackRows,
  };
}
