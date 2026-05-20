/**
 * Media delivery — presigned GET URLs for audio and cover art.
 */
import type { FastifyInstance } from "fastify";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3, buckets } from "../lib/s3.js";
import { isSafeMediaKey } from "../lib/media-keys.js";

const PRESIGN_TTL = Number(process.env.MEDIA_PRESIGN_TTL_SEC ?? 3600);

export async function registerMedia(app: FastifyInstance): Promise<void> {
  app.get("/audio/*", async (req, reply) => {
    const key = (req.params as { "*": string })["*"];
    if (!isSafeMediaKey(key)) return reply.code(400).send({ error: "invalid_key" });
    try {
      const url = await getSignedUrl(
        getS3(),
        new GetObjectCommand({ Bucket: buckets.audio, Key: key }),
        { expiresIn: PRESIGN_TTL },
      );
      return reply.redirect(302, url);
    } catch (err) {
      req.log.warn({ err, key }, "audio presign failed");
      return reply.code(404).send({ error: "not_found" });
    }
  });

  app.get("/images/*", async (req, reply) => {
    const key = (req.params as { "*": string })["*"];
    if (!isSafeMediaKey(key)) return reply.code(400).send({ error: "invalid_key" });
    try {
      const url = await getSignedUrl(
        getS3(),
        new GetObjectCommand({ Bucket: buckets.images, Key: key }),
        { expiresIn: PRESIGN_TTL },
      );
      return reply.redirect(302, url);
    } catch (err) {
      req.log.warn({ err, key }, "image presign failed");
      return reply.code(404).send({ error: "not_found" });
    }
  });
}
