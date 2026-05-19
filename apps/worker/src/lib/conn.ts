import IORedis from "ioredis";

let _conn: IORedis | undefined;

export function conn(): IORedis {
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
