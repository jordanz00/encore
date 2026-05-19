#!/usr/bin/env tsx
/**
 * pnpm seed:catalog [--source=fma|internet_archive|jamendo|all] [--limit=N]
 *
 * Bootstrap a real catalog before any indie/distributor onboarding so listeners
 * never see an empty library.
 */
import { runImporter, importers } from "./index.js";
import type { SeedTrack } from "./types.js";

async function main(): Promise<void> {
  if (process.env.ENABLE_CC_SEED_IMPORT !== "true") {
    console.error(
      "Refusing to run: set ENABLE_CC_SEED_IMPORT=true to acknowledge license attribution responsibility.",
    );
    process.exit(1);
  }
  const args = parseArgs(process.argv.slice(2));
  const sources: SeedTrack["source"][] =
    args.source === "all" || !args.source
      ? (Object.keys(importers) as SeedTrack["source"][])
      : [args.source as SeedTrack["source"]];
  const limit = args.limit ?? 50;

  for (const source of sources) {
    process.stdout.write(`==> seeding ${source} (limit=${limit})\n`);
    const summary = await runImporter(source, limit, {
      onProgress: (n, total) => {
        process.stdout.write(`\r    ${n}/${total}`);
      },
    });
    process.stdout.write(
      `\n    inserted=${summary.inserted} skipped=${summary.skipped} failed=${summary.failed} (${summary.durationMs}ms)\n`,
    );
    if (summary.errors.length > 0) {
      for (const err of summary.errors.slice(0, 5)) {
        process.stderr.write(`    err ${err.upstreamId}: ${err.message}\n`);
      }
    }
  }
  process.exit(0);
}

function parseArgs(argv: string[]): { source?: string; limit?: number } {
  const out: { source?: string; limit?: number } = {};
  for (const a of argv) {
    const m = /^--(source|limit)=(.+)$/.exec(a);
    if (!m) continue;
    if (m[1] === "source") out.source = m[2];
    if (m[1] === "limit") out.limit = Number(m[2]);
  }
  return out;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
