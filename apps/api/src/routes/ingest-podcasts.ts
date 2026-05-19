/**
 * Podcast RSS ingest (Podcasting 2.0 aware).
 *
 * POST /ingest/podcasts          — submit a feed URL for indexing
 * GET  /ingest/podcasts          — list known feeds
 * POST /ingest/podcasts/opml     — bulk-import an OPML subscription file
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, schema } from "@encore/db";
import { desc, eq } from "drizzle-orm";
import { queues } from "../lib/queue.js";
import { requireUser } from "../lib/auth.js";
import { parseOpml } from "@encore/ingest-podcast";

export async function registerPodcastIngest(app: FastifyInstance): Promise<void> {
  app.get("/", async () => {
    const feeds = await db
      .select()
      .from(schema.podcastFeeds)
      .orderBy(desc(schema.podcastFeeds.createdAt))
      .limit(50);
    return { feeds };
  });

  app.post("/", async (req, reply) => {
    const user = await requireUser(req);
    const { feedUrl } = z
      .object({ feedUrl: z.string().url().max(2000) })
      .parse(req.body);

    const [existing] = await db
      .select()
      .from(schema.podcastFeeds)
      .where(eq(schema.podcastFeeds.feedUrl, feedUrl))
      .limit(1);
    if (existing) return { feed: existing, alreadyKnown: true };

    const [feed] = await db
      .insert(schema.podcastFeeds)
      .values({
        feedUrl,
        title: "(pending fetch)",
        addedByUserId: user.id,
        nextFetchAt: new Date(),
      })
      .returning();

    await queues.podcastPoll.add("poll", { feedId: feed!.id, feedUrl });
    return reply.code(202).send({ feed, queued: true });
  });

  app.post("/opml", async (req, reply) => {
    const user = await requireUser(req);
    const body = z
      .object({ opml: z.string().min(1).max(5_000_000) })
      .parse(req.body);
    const entries = parseOpml(body.opml);
    const queued: { feedUrl: string; feedId: string }[] = [];
    const skipped: string[] = [];
    for (const entry of entries) {
      const [existing] = await db
        .select()
        .from(schema.podcastFeeds)
        .where(eq(schema.podcastFeeds.feedUrl, entry.feedUrl))
        .limit(1);
      if (existing) {
        skipped.push(entry.feedUrl);
        continue;
      }
      const [feed] = await db
        .insert(schema.podcastFeeds)
        .values({
          feedUrl: entry.feedUrl,
          title: entry.title,
          websiteUrl: entry.websiteUrl,
          addedByUserId: user.id,
          nextFetchAt: new Date(),
        })
        .returning();
      await queues.podcastPoll.add("poll", { feedId: feed!.id, feedUrl: entry.feedUrl });
      queued.push({ feedUrl: entry.feedUrl, feedId: feed!.id });
    }
    return reply.code(202).send({
      total: entries.length,
      queued: queued.length,
      skipped: skipped.length,
    });
  });
}
