/**
 * Audio embeddings worker — STUB (RFC 004).
 *
 * Will: pull mono 16kHz from HLS, run CLAP / OpenL3 inference, store
 * 1024-dim vector on tracks.embedding (pgvector).
 */
import { Worker, type Job } from "bullmq";
import type { Logger } from "pino";
import { conn, QUEUE_NAMES } from "../lib/conn.js";

interface EmbeddingsPayload { trackId: string }

export function startEmbeddingsWorker(log: Logger): Worker {
  return new Worker<EmbeddingsPayload>(
    QUEUE_NAMES.embeddingsCompute,
    async (job: Job<EmbeddingsPayload>) => {
      log.info({ jobId: job.id, trackId: job.data.trackId }, "embeddings (stub)");
      return { ok: true, stub: true };
    },
    { connection: conn(), concurrency: 1 },
  );
}
