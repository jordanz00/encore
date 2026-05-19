import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, schema } from "@encore/db";
import { eq, desc } from "drizzle-orm";
import { requireUser } from "../lib/auth.js";

export async function registerTracks(app: FastifyInstance): Promise<void> {
  app.get("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const [track] = await db
      .select()
      .from(schema.tracks)
      .where(eq(schema.tracks.id, id))
      .limit(1);
    if (!track) return reply.code(404).send({ error: "not_found" });
    return { track };
  });

  app.get("/", async () => {
    const tracks = await db
      .select()
      .from(schema.tracks)
      .orderBy(desc(schema.tracks.createdAt))
      .limit(50);
    return { tracks };
  });

  const createSchema = z.object({
    releaseId: z.string().uuid(),
    title: z.string().min(1).max(255),
    trackNumber: z.number().int().min(1).max(999).default(1),
    discNumber: z.number().int().min(1).max(99).default(1),
    durationMs: z.number().int().min(0).max(7_200_000).optional(),
    isrc: z.string().length(12).optional(),
    explicit: z.boolean().optional(),
    masterKey: z.string().max(512).optional(),
  });

  app.post("/", async (req, reply) => {
    const user = await requireUser(req);
    const body = createSchema.parse(req.body);
    const [release] = await db
      .select({ id: schema.releases.id, primaryArtistId: schema.releases.primaryArtistId })
      .from(schema.releases)
      .where(eq(schema.releases.id, body.releaseId))
      .limit(1);
    if (!release) return reply.code(404).send({ error: "release_not_found" });

    const [artist] = await db
      .select({ ownerUserId: schema.artists.ownerUserId })
      .from(schema.artists)
      .where(eq(schema.artists.id, release.primaryArtistId))
      .limit(1);
    if (!artist || artist.ownerUserId !== user.id) {
      return reply.code(403).send({ error: "not_artist_owner" });
    }

    const [track] = await db
      .insert(schema.tracks)
      .values({
        releaseId: body.releaseId,
        primaryArtistId: release.primaryArtistId,
        title: body.title,
        trackNumber: body.trackNumber,
        discNumber: body.discNumber,
        durationMs: body.durationMs ?? 0,
        isrc: body.isrc ?? null,
        explicit: body.explicit ?? false,
        masterKey: body.masterKey ?? null,
      })
      .returning();

    await db
      .insert(schema.trackPlayCounters)
      .values({ trackId: track!.id })
      .onConflictDoNothing();
    return { track };
  });
}
