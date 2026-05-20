import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";
import { db } from "@encore/db";

export async function registerHealth(app: FastifyInstance): Promise<void> {
  const build = {
    version: process.env.npm_package_version ?? "0.0.1",
    sha: process.env.GIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
  };

  app.get("/", async () => ({
    ok: true,
    service: "encore-api",
    version: build.version,
    sha: build.sha,
    time: new Date().toISOString(),
  }));

  app.get("/ready", async (_req, reply) => {
    const checks: Record<string, string> = {};
    try {
      await db.execute(sql`select 1`);
      checks.database = "ok";
    } catch {
      return reply.code(503).send({ ready: false, database: "error" });
    }
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        const { default: Redis } = await import("ioredis");
        const client = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
          lazyConnect: true,
        });
        await client.connect();
        await client.ping();
        await client.quit();
        checks.redis = "ok";
      } catch {
        checks.redis = "error";
        return reply.code(503).send({ ready: false, ...checks });
      }
    } else {
      checks.redis = "skipped";
    }
    return { ready: true, ...checks };
  });

  /** Ship-week checklist: /version returns committed SHA. */
  app.get("/version", async () => ({
    service: "encore-api",
    version: build.version,
    sha: build.sha,
    node: process.version,
  }));
}
