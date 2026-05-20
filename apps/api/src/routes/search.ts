/**
 * Search — Meilisearch when available; Postgres ILIKE fallback (production-safe).
 */
import type { FastifyInstance } from "fastify";
import { MeiliSearch } from "meilisearch";
import { searchPostgres } from "../lib/search-postgres.js";
import type {
  SearchArtistHit,
  SearchReleaseHit,
  SearchResponse,
  SearchTrackHit,
} from "../lib/search-types.js";

let _meili: MeiliSearch | undefined;
function meili(): MeiliSearch {
  if (_meili) return _meili;
  _meili = new MeiliSearch({
    host: process.env.MEILI_URL ?? "http://localhost:7700",
    apiKey: process.env.MEILI_MASTER_KEY,
  });
  return _meili;
}

function normalizeMeiliHits(raw: {
  artists: unknown[];
  releases: unknown[];
  tracks: unknown[];
}): SearchResponse {
  const artists: SearchArtistHit[] = raw.artists
    .map((h) => h as Record<string, unknown>)
    .filter((h) => typeof h.id === "string" && typeof h.slug === "string")
    .map((h) => ({
      id: String(h.id),
      name: String(h.name ?? h.slug),
      slug: String(h.slug),
    }));

  const releases: SearchReleaseHit[] = raw.releases
    .map((h) => h as Record<string, unknown>)
    .filter((h) => typeof h.id === "string")
    .map((h) => ({
      id: String(h.id),
      title: String(h.title ?? "Untitled"),
      type: String(h.type ?? "single"),
      coverArtKey: (h.coverArtKey as string | null) ?? null,
      primaryArtistName: String(h.primaryArtistName ?? ""),
      primaryArtistSlug: String(h.primaryArtistSlug ?? ""),
    }));

  const tracks: SearchTrackHit[] = raw.tracks
    .map((h) => h as Record<string, unknown>)
    .filter((h) => typeof h.id === "string" && typeof h.releaseId === "string")
    .map((h) => ({
      id: String(h.id),
      title: String(h.title ?? "Untitled"),
      releaseId: String(h.releaseId),
      releaseTitle: String(h.releaseTitle ?? ""),
      primaryArtistName: String(h.primaryArtistName ?? ""),
      durationMs: Number(h.durationMs ?? 0),
    }));

  return { artists, releases, tracks, source: "meilisearch" };
}

async function searchMeili(q: string): Promise<SearchResponse | null> {
  const m = meili();
  const out = { artists: [] as unknown[], releases: [] as unknown[], tracks: [] as unknown[] };
  const rArtists = await m.index("artists").search(q, { limit: 8 });
  out.artists = rArtists.hits;
  const rReleases = await m.index("releases").search(q, { limit: 12 });
  out.releases = rReleases.hits;
  const rTracks = await m.index("tracks").search(q, { limit: 20 });
  out.tracks = rTracks.hits;
  return normalizeMeiliHits(out);
}

export async function registerSearch(app: FastifyInstance): Promise<void> {
  app.get("/", async (req) => {
    const url = new URL(req.url, "http://x");
    const q = (url.searchParams.get("q") ?? "").trim();
    if (!q || q.length > 200) {
      return { artists: [], releases: [], tracks: [], source: "postgres" as const };
    }

    try {
      const meiliResult = await searchMeili(q);
      const hasHits =
        meiliResult &&
        (meiliResult.artists.length > 0 ||
          meiliResult.releases.length > 0 ||
          meiliResult.tracks.length > 0);
      if (hasHits && meiliResult) return meiliResult;
    } catch (err) {
      app.log.warn({ err }, "meilisearch unavailable — postgres fallback");
    }

    try {
      const pg = await searchPostgres(q);
      return { ...pg, source: "postgres" as const };
    } catch (err) {
      app.log.error({ err }, "postgres search failed");
      return {
        artists: [],
        releases: [],
        tracks: [],
        source: "postgres",
        error: "search_unavailable",
      };
    }
  });
}
