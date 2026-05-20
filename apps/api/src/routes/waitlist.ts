/**
 * Waitlist — POST email for launch audience (ship week).
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, schema } from "@encore/db";

const bodySchema = z.object({
  email: z.string().email().max(254),
  role: z.enum(["listener", "artist", "both"]).default("listener"),
  source: z.string().max(64).default("landing"),
});

export async function registerWaitlist(app: FastifyInstance): Promise<void> {
  app.post("/", async (req, reply) => {
    const body = bodySchema.parse(req.body);
    const email = body.email.toLowerCase().trim();

    try {
      await db.insert(schema.waitlistEntries).values({
        email,
        role: body.role,
        source: body.source,
      });
      return reply.send({ ok: true });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "23505") {
        return reply.send({ ok: true, duplicate: true });
      }
      req.log.error({ err }, "waitlist insert failed");
      return reply.status(500).send({ error: "waitlist_unavailable" });
    }
  });

  /** Admin export — requires WAITLIST_EXPORT_TOKEN header match. */
  app.get("/export", async (req, reply) => {
    const token = process.env.WAITLIST_EXPORT_TOKEN;
    const auth = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token || auth !== token) {
      return reply.status(401).send({ error: "unauthorized" });
    }
    const rows = await db
      .select({
        email: schema.waitlistEntries.email,
        role: schema.waitlistEntries.role,
        source: schema.waitlistEntries.source,
        createdAt: schema.waitlistEntries.createdAt,
      })
      .from(schema.waitlistEntries)
      .orderBy(schema.waitlistEntries.createdAt);
    return { entries: rows };
  });
}
