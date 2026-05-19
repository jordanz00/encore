import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, schema } from "@encore/db";
import { and, eq } from "drizzle-orm";
import { requireUser } from "../lib/auth.js";

export async function registerFollows(app: FastifyInstance): Promise<void> {
  const schemaIn = z.object({ artistId: z.string().uuid() });

  app.post("/", async (req) => {
    const user = await requireUser(req);
    const { artistId } = schemaIn.parse(req.body);
    await db.insert(schema.follows).values({
      followerUserId: user.id,
      artistId,
    }).onConflictDoNothing();
    return { ok: true };
  });

  app.delete("/:artistId", async (req) => {
    const user = await requireUser(req);
    const { artistId } = req.params as { artistId: string };
    await db.delete(schema.follows).where(and(
      eq(schema.follows.followerUserId, user.id),
      eq(schema.follows.artistId, artistId),
    ));
    return { ok: true };
  });
}
