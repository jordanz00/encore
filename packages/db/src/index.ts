/**
 * @encore/db — public entry point.
 *
 * Re-exports the Drizzle client + schema so api/worker/admin import from one place:
 *
 *   import { db, schema } from "@encore/db";
 */

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export { schema };
export * from "./schema.js";

let _db: PostgresJsDatabase<typeof schema> | undefined;

/**
 * Get the singleton Drizzle client.
 *
 * Reads `DATABASE_URL` once. Re-uses one `postgres-js` pool process-wide.
 */
export function getDb(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL not set; cannot initialise @encore/db");
  }
  const client = postgres(url, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idle_timeout: 20,
    prepare: false,
  });
  _db = drizzle(client, { schema, logger: process.env.DB_LOG === "1" });
  return _db;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});
