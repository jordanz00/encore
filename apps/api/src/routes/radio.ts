/**
 * Radio / stations — REAL implementation.
 *
 * GET /radio/track/:trackId
 * GET /radio/artist/:artistId
 * GET /radio/genre/:slug
 * GET /radio/mood/:slug
 *
 * Each station returns up to `limit` tracks, blending similarity around
 * the seed with a small novelty injection so users do not loop.
 */
import type { FastifyInstance } from "fastify";
import { buildRadioStation } from "@encore/recs";

export async function registerRadio(app: FastifyInstance): Promise<void> {
  app.get("/track/:trackId", async (req) => {
    const { trackId } = req.params as { trackId: string };
    const limit = Math.min(Number((req.query as any)?.limit ?? 50), 200);
    const tracks = await buildRadioStation({ kind: "track", seedId: trackId, limit });
    return { kind: "track", seedId: trackId, tracks };
  });

  app.get("/artist/:artistId", async (req) => {
    const { artistId } = req.params as { artistId: string };
    const limit = Math.min(Number((req.query as any)?.limit ?? 50), 200);
    const tracks = await buildRadioStation({ kind: "artist", seedId: artistId, limit });
    return { kind: "artist", seedId: artistId, tracks };
  });

  app.get("/genre/:slug", async (req) => {
    const { slug } = req.params as { slug: string };
    const limit = Math.min(Number((req.query as any)?.limit ?? 50), 200);
    const tracks = await buildRadioStation({ kind: "genre", seedId: slug, limit });
    return { kind: "genre", seedId: slug, tracks };
  });

  app.get("/mood/:slug", async (req) => {
    const { slug } = req.params as { slug: string };
    const limit = Math.min(Number((req.query as any)?.limit ?? 50), 200);
    const tracks = await buildRadioStation({ kind: "mood", seedId: slug, limit });
    return { kind: "mood", seedId: slug, tracks };
  });
}
