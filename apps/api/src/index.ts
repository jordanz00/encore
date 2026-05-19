/**
 * @encore/api — entry point.
 *
 * WHO THIS IS FOR: backend engineers, ops, contributors.
 * WHAT IT DOES: boots a Fastify HTTP server with the Encore routes
 *   (auth, uploads, tracks, releases, playlists, plays, search, recs,
 *   payments, ads, ingest webhooks, federation inbox/outbox, health).
 *
 * Listens on PORT (default 3001).
 */
import { buildServer } from "./server.js";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

async function main(): Promise<void> {
  const app = await buildServer();
  try {
    await app.listen({ port, host });
    app.log.info({ port, host }, "encore api listening");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
