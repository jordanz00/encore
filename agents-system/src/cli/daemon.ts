#!/usr/bin/env node
import { startWorkerPool } from "../workers/worker.pool.js";

const intervalMs = Number(process.env.SWARM_INTERVAL_MS ?? 30_000);
const batchSize = Number(process.env.SWARM_BATCH_SIZE ?? 6);

await startWorkerPool({ intervalMs, batchSize });
