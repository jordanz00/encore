import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, schema } from "@encore/db";
import { eq } from "drizzle-orm";
import { requireUser } from "../lib/auth.js";

export async function registerArtists(app: FastifyInstance): Promise<void> {
  app.get("/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const [artist] = await db
      .select()
      .from(schema.artists)
      .where(eq(schema.artists.slug, slug))
      .limit(1);
    if (!artist) return reply.code(404).send({ error: "not_found" });
    return { artist };
  });

  const createSchema = z.object({
    slug: z
      .string()
      .min(2)
      .max(64)
      .regex(/^[a-z0-9_-]+$/),
    name: z.string().min(1).max(200),
    bio: z.string().max(5000).optional(),
    location: z.string().max(120).optional(),
    websiteUrl: z.string().url().max(2000).optional(),
  });

  app.post("/", async (req, reply) => {
    const user = await requireUser(req);
    const body = createSchema.parse(req.body);
    try {
      const [artist] = await db
        .insert(schema.artists)
        .values({
          ownerUserId: user.id,
          slug: body.slug,
          name: body.name,
          bio: body.bio ?? null,
          location: body.location ?? null,
          websiteUrl: body.websiteUrl ?? null,
        })
        .returning();
      return { artist };
    } catch (err) {
      app.log.warn({ err }, "artist insert failed");
      return reply.code(409).send({ error: "slug_in_use" });
    }
  });
}
