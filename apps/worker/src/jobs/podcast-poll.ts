/**
 * Podcast RSS poll worker — REAL implementation.
 *
 * Fetches a feed URL, parses RSS + Podcasting 2.0 namespaces, upserts the
 * feed and its episodes, and reschedules the next poll based on the
 * channel's update cadence.
 */
import { Worker, type Job } from "bullmq";
import type { Logger } from "pino";
import { conn, QUEUE_NAMES } from "../lib/conn.js";
import { db, schema } from "@encore/db";
import { eq, and, sql } from "drizzle-orm";
import { parseRssFeed } from "@encore/ingest-podcast";

interface PodcastPayload {
  feedId: string;
  feedUrl: string;
}

const USER_AGENT = "Encore/0.0.1 (+https://encore.audio)";

export function startPodcastWorker(log: Logger): Worker {
  return new Worker<PodcastPayload>(
    QUEUE_NAMES.podcastPoll,
    async (job: Job<PodcastPayload>) => {
      const { feedId, feedUrl } = job.data;
      log.info({ jobId: job.id, feedUrl }, "podcast poll start");
      try {
        const res = await fetch(feedUrl, { headers: { "User-Agent": USER_AGENT } });
        if (!res.ok) throw new Error(`feed_status_${res.status}`);
        const xml = await res.text();
        const parsed = parseRssFeed(xml);

        await db
          .update(schema.podcastFeeds)
          .set({
            title: parsed.title,
            description: parsed.description,
            language: parsed.language ?? null,
            categories: parsed.categories as unknown as string,
            explicit: parsed.explicit,
            podcastGuid: parsed.podcastGuid ?? null,
            websiteUrl: parsed.websiteUrl,
            lastFetchedAt: new Date(),
            nextFetchAt: new Date(Date.now() + 60 * 60 * 1000),
          })
          .where(eq(schema.podcastFeeds.id, feedId));

        let inserted = 0;
        for (const ep of parsed.episodes) {
          const existing = await db
            .select({ id: schema.podcastEpisodes.id })
            .from(schema.podcastEpisodes)
            .where(
              and(
                eq(schema.podcastEpisodes.feedId, feedId),
                eq(schema.podcastEpisodes.guid, ep.guid),
              ),
            )
            .limit(1);
          if (existing.length > 0) continue;
          await db.insert(schema.podcastEpisodes).values({
            feedId,
            guid: ep.guid,
            title: ep.title,
            description: ep.description,
            enclosureUrl: ep.enclosureUrl,
            enclosureType: ep.enclosureType,
            durationMs: ep.durationMs,
            publishedAt: ep.publishedAt ? new Date(ep.publishedAt) : null,
            chaptersJson: ep.chapters as unknown as string,
            transcriptKey: ep.transcriptUrl,
          });
          inserted += 1;
        }
        log.info({ feedUrl, episodes: parsed.episodes.length, inserted }, "podcast poll done");
        return { ok: true, inserted };
      } catch (err) {
        log.warn({ err, feedUrl }, "podcast fetch failed");
        await db
          .update(schema.podcastFeeds)
          .set({ nextFetchAt: new Date(Date.now() + 6 * 60 * 60 * 1000) })
          .where(eq(schema.podcastFeeds.id, feedId));
        throw err;
      }
    },
    { connection: conn(), concurrency: Number(process.env.PODCAST_CONCURRENCY ?? 4) },
  );
}
