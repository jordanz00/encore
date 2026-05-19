/**
 * BullMQ queues — shared between api (enqueue) and worker (process).
 * Queue names live here to keep producers/consumers in sync.
 */
import { Queue } from "bullmq";
import IORedis from "ioredis";

let _conn: IORedis | undefined;

function conn(): IORedis {
  if (_conn) return _conn;
  _conn = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
  return _conn;
}

export const QUEUE_NAMES = {
  audioTranscode: "audio:transcode",
  podcastPoll: "podcast:poll",
  ddexDelivery: "ddex:delivery",
  embeddingsCompute: "embeddings:compute",
  outboxFanout: "federation:outbox-fanout",
} as const;

export const queues = {
  audioTranscode: new Queue(QUEUE_NAMES.audioTranscode, { connection: conn() }),
  podcastPoll: new Queue(QUEUE_NAMES.podcastPoll, { connection: conn() }),
  ddexDelivery: new Queue(QUEUE_NAMES.ddexDelivery, { connection: conn() }),
  embeddingsCompute: new Queue(QUEUE_NAMES.embeddingsCompute, { connection: conn() }),
  outboxFanout: new Queue(QUEUE_NAMES.outboxFanout, { connection: conn() }),
};
