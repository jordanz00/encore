/**
 * Drizzle migration runner.
 * Usage: pnpm --filter @encore/db migrate
 *
 * Reads DATABASE_URL from env and applies any pending SQL files in `./drizzle/`.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);
  console.log("[db] migrating...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[db] done.");
  await sql.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
