import type { FastifyInstance } from "fastify";

export async function registerHealth(app: FastifyInstance): Promise<void> {
  app.get("/", async () => ({
    ok: true,
    service: "encore-api",
    version: "0.0.1",
    time: new Date().toISOString(),
  }));

  app.get("/ready", async () => ({ ready: true }));
}
