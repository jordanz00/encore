import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://encore:encore@localhost:5432/encore",
  },
  strict: true,
  verbose: true,
} satisfies Config;
