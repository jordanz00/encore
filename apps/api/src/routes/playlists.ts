import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, schema } from "@encore/db";
import { and, eq, asc, max } from "drizzle-orm";
import { requireUser } from "../lib/auth.js";

export async function registerPlaylists(app: FastifyInstance): Promise<void> {
  app.get("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const [playlist] = await db.select().from(schema.playlists).where(eq(schema.playlists.id, id)).limit(1);
    if (!playlist) return reply.code(404).send({ error: "not_found" });
    const items = await db.select().from(schema.playlistItems).where(eq(schema.playlistItems.playlistId, id)).orderBy(asc(schema.playlistItems.position));
    return { playlist, items };
  });

  app.post("/", async (req) => {
    const user = await requireUser(req);
    const body = z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      isPublic: z.boolean().default(true),
      isCollaborative: z.boolean().default(false),
    }).parse(req.body);
    const [playlist] = await db.insert(schema.playlists).values({
      ownerUserId: user.id,
      title: body.title,
      description: body.description ?? null,
      isPublic: body.isPublic,
      isCollaborative: body.isCollaborative,
    }).returning();
    return { playlist };
  });

  app.post("/:id/items", async (req, reply) => {
    const user = await requireUser(req);
    const { id } = req.params as { id: string };
    const { trackId } = z.object({ trackId: z.string().uuid() }).parse(req.body);
    const [playlist] = await db.select({
      ownerUserId: schema.playlists.ownerUserId,
      isCollaborative: schema.playlists.isCollaborative,
    }).from(schema.playlists).where(eq(schema.playlists.id, id)).limit(1);
    if (!playlist) return reply.code(404).send({ error: "not_found" });
    if (playlist.ownerUserId !== user.id && !playlist.isCollaborative) {
      return reply.code(403).send({ error: "not_owner" });
    }
    const [{ value }] = await db.select({ value: max(schema.playlistItems.position) }).from(schema.playlistItems).where(eq(schema.playlistItems.playlistId, id));
    const position = (value ?? -1) + 1;
    await db.insert(schema.playlistItems).values({
      playlistId: id, trackId, position, addedByUserId: user.id,
    });
    return { ok: true, position };
  });

  app.delete("/:id/items/:position", async (req, reply) => {
    const user = await requireUser(req);
    const { id, position } = req.params as { id: string; position: string };
    const [playlist] = await db.select({ ownerUserId: schema.playlists.ownerUserId }).from(schema.playlists).where(eq(schema.playlists.id, id)).limit(1);
    if (!playlist) return reply.code(404).send({ error: "not_found" });
    if (playlist.ownerUserId !== user.id) return reply.code(403).send({ error: "not_owner" });
    await db.delete(schema.playlistItems).where(and(
      eq(schema.playlistItems.playlistId, id),
      eq(schema.playlistItems.position, Number(position)),
    ));
    return { ok: true };
  });
}
