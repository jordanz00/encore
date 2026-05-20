/**
 * ActivityPub outbox fanout worker — REAL implementation.
 *
 * Consumes outbox events (typically a Create(Note) for a published release),
 * resolves the artist's followers (remote inbox URLs), signs each request
 * with the artist's private key, and POSTs the activity.
 */
import { Worker, type Job } from "bullmq";
import type { Logger } from "pino";
import { eq, sql } from "drizzle-orm";
import { conn, QUEUE_NAMES } from "../lib/conn.js";
import { db, schema } from "@encore/db";
import { signRequest } from "@encore/activitypub";

interface OutboxPayload {
  artistId: string;
  activity: Record<string, unknown>;
  privateKeyPem: string;
  keyId: string;
}

const USER_AGENT = "Encore-Federation/0.0.1";

export function startOutboxWorker(log: Logger): Worker {
  return new Worker<OutboxPayload>(
    QUEUE_NAMES.outboxFanout,
    async (job: Job<OutboxPayload>) => {
      const { artistId, activity, privateKeyPem, keyId } = job.data;
      log.info({ jobId: job.id, artistId }, "outbox fanout start");

      const followerInboxes = await db.execute<{ inbox_url: string }>(sql`
        SELECT DISTINCT follower_inbox_url AS inbox_url
        FROM remote_followers
        WHERE artist_id = ${artistId}
          AND follower_inbox_url IS NOT NULL
      `);
      const list = (followerInboxes as unknown as { rows: any[] }).rows ?? [];
      const body = JSON.stringify(activity);

      let delivered = 0;
      let failed = 0;
      for (const row of list) {
        const inboxUrl: string = row.inbox_url;
        try {
          const headers = signRequest({
            method: "POST",
            url: inboxUrl,
            body,
            privateKeyPem,
            keyId,
          });
          const res = await fetch(inboxUrl, {
            method: "POST",
            headers: { ...headers, "User-Agent": USER_AGENT },
            body,
          });
          if (res.ok || res.status === 202) delivered += 1;
          else failed += 1;
        } catch (err) {
          log.warn({ err, inboxUrl }, "outbox post failed");
          failed += 1;
        }
      }
      log.info({ artistId, delivered, failed }, "outbox fanout done");
      return { ok: true, delivered, failed };
    },
    { connection: conn(), concurrency: Number(process.env.OUTBOX_CONCURRENCY ?? 4) },
  );
}
