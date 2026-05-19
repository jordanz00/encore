/**
 * S3 helper for the worker — download masters, upload outputs.
 */
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { pipeline } from "node:stream/promises";

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

export async function downloadObject(bucket: string, key: string, destPath: string): Promise<void> {
  await mkdir(dirname(destPath), { recursive: true });
  const res = await getS3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = res.Body as NodeJS.ReadableStream | undefined;
  if (!body) throw new Error(`s3_empty_body: ${bucket}/${key}`);
  await pipeline(body, createWriteStream(destPath));
}

export async function uploadFile(
  bucket: string,
  key: string,
  filePath: string,
  contentType?: string,
): Promise<void> {
  const upload = new Upload({
    client: getS3(),
    params: {
      Bucket: bucket,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: contentType,
    },
  });
  await upload.done();
}

export async function uploadJson(bucket: string, key: string, data: unknown): Promise<void> {
  await getS3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    }),
  );
}
