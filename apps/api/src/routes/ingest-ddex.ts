/**
 * DDEX ERN-4 distributor ingest — REAL implementation.
 *
 * Endpoints:
 *   POST /ingest/ddex/deliveries   — receive a delivery manifest
 *   POST /ingest/ddex/dsr          — generate a DSR usage report (admin)
 *
 * Delivery flow:
 *   1. Distributor POSTs manifest URL + release ref + HMAC signature.
 *   2. We verify HMAC against per-distributor shared secret.
 *   3. We enqueue a delivery job; the worker fetches + parses ERN XML and
 *      upserts artists, releases, tracks, then enqueues transcodes.
 */
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { db, schema } from "@encore/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { queues } from "../lib/queue.js";
import {
  verifyDeliverySignature,
  buildDsrUsageReport,
  type DsrUsageRow,
} from "@encore/ingest-ddex";

export async function registerDdexIngest(app: FastifyInstance): Promise<void> {
  app.post("/deliveries", async (req, reply) => {
    if (process.env.ENABLE_DDEX_INGEST !== "true") {
      return reply.code(503).send({ error: "ddex_disabled" });
    }
    const rawBody = await collectRawBody(req);
    const distributorRefHeader = String(
      req.headers["x-encore-distributor"] ?? "",
    ).slice(0, 100);
    const signature = String(req.headers["x-encore-signature"] ?? "");
    const timestamp = String(req.headers["x-encore-timestamp"] ?? "");

    const [source] = await db
      .select()
      .from(schema.ingestSources)
      .where(eq(schema.ingestSources.distributorRef, distributorRefHeader))
      .limit(1);
    if (!source || !source.enabled) {
      return reply.code(403).send({ error: "distributor_unknown_or_disabled" });
    }

    const cfg = source.configJson as { sharedSecret?: string } | null;
    if (!cfg?.sharedSecret) {
      return reply.code(500).send({ error: "distributor_missing_secret" });
    }

    const verified = verifyDeliverySignature({
      body: rawBody,
      signatureHex: signature,
      sharedSecret: cfg.sharedSecret,
      timestampHeader: timestamp,
    });
    if (!verified.ok) {
      return reply.code(401).send({ error: "signature_invalid", reason: verified.reason });
    }

    const body = z
      .object({
        manifestUrl: z.string().url().max(2000),
        releaseId: z.string().min(1).max(100),
      })
      .parse(JSON.parse(rawBody.toString("utf8")));

    const [job] = await db
      .insert(schema.ingestJobs)
      .values({
        sourceId: source.id,
        kind: "ddex",
        payloadRef: body.manifestUrl,
        status: "queued",
      })
      .returning();

    await queues.ddexDelivery.add("delivery", {
      jobId: job!.id,
      manifestUrl: body.manifestUrl,
      distributorRef: distributorRefHeader,
      releaseId: body.releaseId,
    });

    return reply.code(202).send({ accepted: true, jobId: job!.id });
  });

  app.post("/dsr", async (req, reply) => {
    if (process.env.ENABLE_DDEX_INGEST !== "true") {
      return reply.code(503).send({ error: "ddex_disabled" });
    }
    const body = z
      .object({
        distributorRef: z.string().min(1).max(100),
        periodMonth: z.string().regex(/^\d{4}-\d{2}$/),
      })
      .parse(req.body);

    const [year, month] = body.periodMonth.split("-").map(Number);
    const start = new Date(Date.UTC(year!, month! - 1, 1));
    const end = new Date(Date.UTC(year!, month!, 1));

    const rows = await db.execute<{
      isrc: string | null;
      total_plays: string;
      total_listeners: string;
      country: string | null;
    }>(sql`
      SELECT t.isrc,
             COUNT(p.id)::text AS total_plays,
             COUNT(DISTINCT p.user_id)::text AS total_listeners,
             COALESCE(p.country_code, 'WW') AS country
      FROM plays p
      JOIN tracks t ON t.id = p.track_id
      WHERE p.played_at >= ${start} AND p.played_at < ${end}
        AND t.isrc IS NOT NULL
      GROUP BY t.isrc, p.country_code
    `);

    const list = (rows as unknown as { rows: any[] }).rows ?? [];
    const dsrRows: DsrUsageRow[] = list
      .filter((r) => r.isrc)
      .map((r) => ({
        isrc: r.isrc!,
        currency: "USD",
        period: body.periodMonth,
        totalPlays: Number(r.total_plays),
        totalListeners: Number(r.total_listeners),
        payableNetCents: Math.round(Number(r.total_plays) * 0.4),
        countryCode: r.country ?? "WW",
      }));

    const text = buildDsrUsageReport({
      distributorRef: body.distributorRef,
      periodMonth: body.periodMonth,
      rows: dsrRows,
    });
    return reply
      .type("text/plain; charset=utf-8")
      .header(
        "Content-Disposition",
        `attachment; filename="dsr-${body.distributorRef}-${body.periodMonth}.txt"`,
      )
      .send(text);
  });
}

async function collectRawBody(req: FastifyRequest): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body, "utf8");
  return Buffer.from(JSON.stringify(req.body ?? {}), "utf8");
}
