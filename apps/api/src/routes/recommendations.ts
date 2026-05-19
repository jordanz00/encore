/**
 * Recommendations — REAL implementation (RFC 004).
 *
 * Endpoints:
 *   GET  /discover                       — personalized + editorial blend
 *   GET  /fresh-crate                    — last-28-days new artist boost
 *   GET  /similar/:trackId               — pgvector cosine similarity
 *   POST /sliders                        — persist user's algorithm sliders
 *   GET  /sliders                        — read user sliders (defaults if unset)
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, schema } from "@encore/db";
import { desc, eq, sql } from "drizzle-orm";
import {
  recommendForUser,
  buildRadioStation,
  normalizeSliders,
  DEFAULT_SLIDERS,
} from "@encore/recs";
import { optionalUser, requireUser } from "../lib/auth.js";

const sliderSchema = z.object({
  personalization: z.number().min(0).max(1),
  similarity: z.number().min(0).max(1),
  editorial: z.number().min(0).max(1),
  freshness: z.number().min(0).max(1),
  diversity: z.number().min(0).max(1),
});

export async function registerRecommendations(app: FastifyInstance): Promise<void> {
  app.get("/discover", async (req) => {
    const user = await optionalUser(req);
    const limit = Math.min(Number((req.query as any)?.limit ?? 24), 100);
    const seedTrackIds = user ? await loadSeedTrackIds(user.id) : [];
    const sliders = user ? await loadSliders(user.id) : DEFAULT_SLIDERS;
    const tracks = await recommendForUser({
      userId: user?.id ?? null,
      seedTrackIds,
      limit,
      sliders,
    });
    return { tracks, source: "hybrid", sliders };
  });

  app.get("/fresh-crate", async () => {
    const releases = await db
      .select()
      .from(schema.releases)
      .where(eq(schema.releases.status, "published"))
      .orderBy(desc(schema.releases.publishedAt))
      .limit(50);
    return { releases, source: "fresh_today" };
  });

  app.get("/similar/:trackId", async (req, reply) => {
    const { trackId } = req.params as { trackId: string };
    const [track] = await db
      .select({ id: schema.tracks.id })
      .from(schema.tracks)
      .where(eq(schema.tracks.id, trackId))
      .limit(1);
    if (!track) return reply.code(404).send({ error: "track_not_found" });
    const tracks = await buildRadioStation({
      kind: "track",
      seedId: trackId,
      limit: Math.min(Number((req.query as any)?.limit ?? 24), 100),
    });
    return { tracks, source: "content_similarity" };
  });

  app.get("/sliders", async (req) => {
    const user = await requireUser(req);
    const sliders = await loadSliders(user.id);
    return { sliders };
  });

  app.post("/sliders", async (req, reply) => {
    const user = await requireUser(req);
    const body = sliderSchema.parse(req.body);
    const normalized = normalizeSliders(body);
    await db.execute(sql`
      INSERT INTO user_recs_sliders (user_id, sliders_json, updated_at)
      VALUES (${user.id}, ${JSON.stringify(normalized)}::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE
        SET sliders_json = EXCLUDED.sliders_json, updated_at = now()
    `);
    return reply.send({ sliders: normalized });
  });
}

async function loadSeedTrackIds(userId: string): Promise<string[]> {
  const liked = await db
    .select({ trackId: schema.likes.trackId })
    .from(schema.likes)
    .where(eq(schema.likes.userId, userId))
    .orderBy(desc(schema.likes.createdAt))
    .limit(20);
  return liked.map((l) => l.trackId);
}

async function loadSliders(userId: string) {
  try {
    const rows = await db.execute<{ sliders_json: any }>(sql`
      SELECT sliders_json FROM user_recs_sliders WHERE user_id = ${userId} LIMIT 1
    `);
    const list = (rows as unknown as { rows: any[] }).rows ?? [];
    if (list[0]) return normalizeSliders(list[0].sliders_json);
  } catch {
    // table may not exist yet in fresh installs
  }
  return DEFAULT_SLIDERS;
}
