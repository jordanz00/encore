/**
 * Thin S3-compatible client (works with MinIO in dev, R2/Backblaze/S3 in prod).
 */
import { S3Client } from "@aws-sdk/client-s3";

let _client: S3Client | undefined;

export function getS3(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: process.env.S3_ENDPOINT ?? undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials:
      process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
          }
        : undefined,
  });
  return _client;
}

export const buckets = {
  uploads: process.env.S3_BUCKET_UPLOADS ?? "encore-uploads",
  audio: process.env.S3_BUCKET_AUDIO ?? "encore-audio",
  images: process.env.S3_BUCKET_IMAGES ?? "encore-images",
};
