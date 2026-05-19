/**
 * @encore/worker — entry point.
 *
 * Boots BullMQ workers for: audio transcoding, podcast RSS polling,
 * DDEX delivery processing, embeddings compute (stub), federation outbox
 * fanout (stub).
 */
import pino from "pino";
import { startTranscodeWorker } from "./jobs/transcode.js";
import { startPodcastWorker } from "./jobs/podcast-poll.js";
import { startDdexWorker } from "./jobs/ddex-delivery.js";
import { startEmbeddingsWorker } from "./jobs/embeddings.js";
import { startOutboxWorker } from "./jobs/outbox.js";

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });

async function main(): Promise<void> {
  log.info("encore worker starting");
  startTranscodeWorker(log);
  startPodcastWorker(log);
  startDdexWorker(log);
  startEmbeddingsWorker(log);
  startOutboxWorker(log);
  log.info("all workers running");
}

main().catch((err) => {
  log.error(err, "worker startup failed");
  process.exit(1);
});
