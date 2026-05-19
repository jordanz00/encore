/**
 * Play recording — privacy-respecting.
 *
 * A play is "verified" when the client reports >= 30 seconds delivered.
 * If the user has `disableDetailedPlayTracking` we only bump aggregate
 * counters; no row in `plays` is written. This matches DSR-class
 * definitions used by Merlin and others.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, schema } from "@encore/db";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "../lib/auth.js";

const VERIFIED_PLAY_SECONDS = Number(process.env.VERIFIED_PLAY_SECONDS ?? 30);

export async function registerPlays(app: FastifyInstance): Promise<void> {
  const reportSchema = z.object({
    trackId: z.string().uuid(),
    secondsDelivered: z.number().int().min(0).max(86_400),
    surface: z.enum(["web", "mobile", "desktop", "carplay", "embed"]).default("web"),
    countryCode: z.string().length(2).optional(),
  });

  app.post("/", async (req, reply) => {
    const body = reportSchema.parse(req.body);
    const user = await getCurrentUser(req);
    const verified = body.secondsDelivered >= VERIFIED_PLAY_SECONDS;

    const [user2] = user
      ? await db.select({
          disable: schema.users.disableDetailedPlayTracking,
        }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1)
      : [{ disable: true }];

    if (verified) {
      await db.insert(schema.trackPlayCounters).values({
        trackId: body.trackId,
        totalPlays: 1n,
        last7d: 1,
        last30d: 1,
      }).onConflictDoUpdate({
        target: schema.trackPlayCounters.trackId,
        set: {
          totalPlays: sql`${schema.trackPlayCounters.totalPlays} + 1`,
          last7d: sql`${schema.trackPlayCounters.last7d} + 1`,
          last30d: sql`${schema.trackPlayCounters.last30d} + 1`,
          updatedAt: new Date(),
        },
      });

      if (!user2?.disable) {
        await db.insert(schema.plays).values({
          trackId: body.trackId,
          userId: user?.id ?? null,
          countryCode: body.countryCode ?? null,
          surface: body.surface,
          secondsDelivered: body.secondsDelivered,
          isVerifiedPlay: true,
          segmentSource: "hls",
        });
      }
    }

    return reply.code(204).send();
  });
}
