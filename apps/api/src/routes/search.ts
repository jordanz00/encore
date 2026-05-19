/**
 * Search — Meilisearch-backed (typo-tolerant, fast).
 *
 * Indexes (created lazily on first hit):
 *   - artists  (id, name, slug)
 *   - releases (id, title, primaryArtistName)
 *   - tracks   (id, title, primaryArtistName, releaseTitle)
 */
import type { FastifyInstance } from "fastify";
import { MeiliSearch } from "meilisearch";

let _meili: MeiliSearch | undefined;
function meili(): MeiliSearch {
  if (_meili) return _meili;
  _meili = new MeiliSearch({
    host: process.env.MEILI_URL ?? "http://localhost:7700",
    apiKey: process.env.MEILI_MASTER_KEY,
  });
  return _meili;
}

export async function registerSearch(app: FastifyInstance): Promise<void> {
  app.get("/", async (req) => {
    const url = new URL(req.url, "http://x");
    const q = url.searchParams.get("q") ?? "";
    const type = (url.searchParams.get("type") ?? "all") as "all" | "artists" | "releases" | "tracks";
    if (!q) return { artists: [], releases: [], tracks: [] };

    try {
      const out: { artists: unknown[]; releases: unknown[]; tracks: unknown[] } = {
        artists: [], releases: [], tracks: [],
      };
      const m = meili();
      if (type === "all" || type === "artists") {
        const r = await m.index("artists").search(q, { limit: 8 });
        out.artists = r.hits;
      }
      if (type === "all" || type === "releases") {
        const r = await m.index("releases").search(q, { limit: 12 });
        out.releases = r.hits;
      }
      if (type === "all" || type === "tracks") {
        const r = await m.index("tracks").search(q, { limit: 20 });
        out.tracks = r.hits;
      }
      return out;
    } catch (err) {
      app.log.warn({ err }, "search failed (meili down?)");
      return { artists: [], releases: [], tracks: [], error: "search_unavailable" };
    }
  });
}
