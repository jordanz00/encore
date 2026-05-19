/**
 * Upload routes — issues presigned PUT URLs to S3-compatible storage.
 *
 * Flow:
 *   1. Client POSTs { kind, contentType, sizeBytes, hashSha256 } to /uploads/presign
 *   2. Server validates (allowed types, size ceiling), creates an S3 object key,
 *      returns { url, key, headers } for direct PUT.
 *   3. Client uploads bytes directly to S3.
 *   4. Client POSTs /uploads/finalize with { key, trackId|releaseId } so the
 *      transcode worker can pick it up.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3, buckets } from "../lib/s3.js";
import { queues, QUEUE_NAMES } from "../lib/queue.js";
import { requireUser } from "../lib/auth.js";
import crypto from "node:crypto";

const ALLOWED_AUDIO = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/x-flac",
  "audio/mpeg",
  "audio/aac",
  "audio/ogg",
  "audio/opus",
]);
const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AUDIO_BYTES = 1024 * 1024 * 1024; // 1 GiB
const MAX_IMAGE_BYTES = 1024 * 1024 * 25; // 25 MiB

export async function registerUploads(app: FastifyInstance): Promise<void> {
  const presignSchema = z.object({
    kind: z.enum(["audio_master", "cover_art", "avatar", "banner"]),
    contentType: z.string().min(1).max(100),
    sizeBytes: z.number().int().positive(),
  });

  app.post("/presign", async (req, reply) => {
    const user = await requireUser(req);
    const body = presignSchema.parse(req.body);

    if (body.kind === "audio_master") {
      if (!ALLOWED_AUDIO.has(body.contentType)) {
        return reply.code(415).send({ error: "audio_type_not_allowed" });
      }
      if (body.sizeBytes > MAX_AUDIO_BYTES) {
        return reply.code(413).send({ error: "audio_too_large" });
      }
    } else {
      if (!ALLOWED_IMAGE.has(body.contentType)) {
        return reply.code(415).send({ error: "image_type_not_allowed" });
      }
      if (body.sizeBytes > MAX_IMAGE_BYTES) {
        return reply.code(413).send({ error: "image_too_large" });
      }
    }

    const ext = body.contentType.split("/")[1] ?? "bin";
    const key = `${body.kind}/${user.id}/${crypto.randomUUID()}.${ext}`;
    const cmd = new PutObjectCommand({
      Bucket: buckets.uploads,
      Key: key,
      ContentType: body.contentType,
      ContentLength: body.sizeBytes,
    });
    const url = await getSignedUrl(getS3(), cmd, { expiresIn: 60 * 15 });

    return {
      url,
      key,
      headers: { "Content-Type": body.contentType },
      expiresIn: 60 * 15,
    };
  });

  const finalizeSchema = z.object({
    key: z.string().min(1).max(512),
    trackId: z.string().uuid().optional(),
  });

  app.post("/finalize", async (req, reply) => {
    const user = await requireUser(req);
    const body = finalizeSchema.parse(req.body);
    if (!body.key.startsWith(`audio_master/${user.id}/`)) {
      return reply.code(403).send({ error: "key_owner_mismatch" });
    }

    await queues.audioTranscode.add(
      "transcode",
      { key: body.key, userId: user.id, trackId: body.trackId ?? null },
      { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
    );

    return { queued: true, queue: QUEUE_NAMES.audioTranscode };
  });
}
