#!/usr/bin/env node
import { runCycle } from "../core/orchestrator.js";

const batchSize = Number(process.env.SWARM_BATCH_SIZE ?? 5);
const dryRun = process.argv.includes("--dry-run");
const report = await runCycle({
  batchSize,
  applyPatches: !dryRun,
  quiet: false,
});

process.exitCode = report.tasksRejected > 0 ? 1 : 0;
