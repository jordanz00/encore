/**
 * DDEX delivery worker — REAL implementation.
 *
 * Pulls the manifest XML from the distributor's URL, parses ERN-4, then
 * upserts artists, releases, and tracks. For each sound recording it
 * enqueues a transcode job (the audio file URL is passed as `key` so the
 * transcoder can fetch via HTTPS in addition to S3).
 */
import { Worker, type Job } from "bullmq";
import type { Logger } from "pino";
import { sql, eq } from "drizzle-orm";
import { conn, QUEUE_NAMES, queues } from "../lib/conn.js";
import { db, schema } from "@encore/db";
import { parseErn4Manifest } from "@encore/ingest-ddex";

interface DdexPayload {
  jobId: string;
  manifestUrl: string;
  distributorRef: string;
  releaseId: string;
}

const USER_AGENT = "Encore-DDEX/0.0.1";

export function startDdexWorker(log: Logger): Worker {
  return new Worker<DdexPayload>(
    QUEUE_NAMES.ddexDelivery,
    async (job: Job<DdexPayload>) => {
      const { jobId, manifestUrl, distributorRef } = job.data;
      log.info({ jobId, manifestUrl, distributorRef }, "ddex delivery start");
      try {
        await db
          .update(schema.ingestJobs)
          .set({
            status: "processing",
            startedAt: new Date(),
            attempts: sql`${schema.ingestJobs.attempts} + 1`,
          })
          .where(eq(schema.ingestJobs.id, jobId));

        const res = await fetch(manifestUrl, { headers: { "User-Agent": USER_AGENT } });
        if (!res.ok) throw new Error(`manifest_status_${res.status}`);
        const xml = await res.text();
        const ern = parseErn4Manifest(xml);

        for (const release of ern.releases) {
          const artistName = release.displayArtist ?? "Unknown Artist";
          const slug = slugify(artistName);
          const existingArtist = await db
            .select()
            .from(schema.artists)
            .where(eq(schema.artists.slug, slug))
            .limit(1);
          let artistId: string;
          if (existingArtist[0]) {
            artistId = existingArtist[0].id;
          } else {
            const [created] = await db
              .insert(schema.artists)
              .values({ slug, name: artistName })
              .returning();
            artistId = created!.id;
          }

          const [createdRelease] = await db
            .insert(schema.releases)
            .values({
              primaryArtistId: artistId,
              title: release.title,
              type: mapReleaseType(release.releaseType),
              status: "scheduled",
              upc: release.upc,
              genres: release.genres as unknown as string,
              credits: [
                release.pLine ? { role: "p_line", text: release.pLine } : null,
                release.cLine ? { role: "c_line", text: release.cLine } : null,
                release.labelName ? { role: "label", name: release.labelName } : null,
              ].filter(Boolean) as unknown as string,
              releaseDate: release.releaseDate ? new Date(release.releaseDate) : null,
              sourceKind: "ddex",
              sourceRef: `${distributorRef}:${ern.messageId}:${release.releaseReference}`,
            })
            .returning();

          for (let i = 0; i < release.trackResourceRefs.length; i += 1) {
            const ref = release.trackResourceRefs[i]!;
            const sr = ern.soundRecordings.get(ref);
            if (!sr) continue;
            const [createdTrack] = await db
              .insert(schema.tracks)
              .values({
                releaseId: createdRelease!.id,
                primaryArtistId: artistId,
                title: sr.title,
                trackNumber: i + 1,
                durationMs: sr.durationMs ?? 0,
                isrc: sr.isrc,
                masterKey: sr.audioFileUri ?? null,
              })
              .returning();
            if (sr.audioFileUri) {
              await queues.audioTranscode.add("transcode", {
                key: sr.audioFileUri,
                userId: distributorRef,
                trackId: createdTrack!.id,
              });
            }
          }
        }

        await db
          .update(schema.ingestJobs)
          .set({ status: "complete", finishedAt: new Date() })
          .where(eq(schema.ingestJobs.id, jobId));
        log.info({ jobId, releases: ern.releases.length }, "ddex delivery done");
        return { ok: true, releases: ern.releases.length };
      } catch (err) {
        await db
          .update(schema.ingestJobs)
          .set({ status: "failed", finishedAt: new Date(), error: (err as Error).message })
          .where(eq(schema.ingestJobs.id, jobId));
        throw err;
      }
    },
    { connection: conn(), concurrency: Number(process.env.DDEX_CONCURRENCY ?? 2) },
  );
}

function slugify(s: string): string {
  return (
    s
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "artist"
  );
}

function mapReleaseType(s: string): "single" | "ep" | "album" | "compilation" {
  const t = s.toLowerCase();
  if (t === "single") return "single";
  if (t === "ep") return "ep";
  if (t === "compilation") return "compilation";
  return "album";
}
