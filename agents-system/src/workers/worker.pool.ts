import { runCycle } from "../core/orchestrator.js";

export interface PoolOptions {
  intervalMs?: number;
  batchSize?: number;
  maxCycles?: number;
}

/** Continuous swarm loop — one orchestrator cycle per interval. */
export async function startWorkerPool(opts: PoolOptions = {}): Promise<void> {
  const intervalMs = opts.intervalMs ?? 30_000;
  const batchSize = opts.batchSize ?? 6;
  let cycles = 0;
  const maxCycles = opts.maxCycles ?? Infinity;

  console.log(`Encore swarm pool — interval ${intervalMs}ms, batch ${batchSize}\n`);

  const tick = async (): Promise<void> => {
    if (cycles >= maxCycles) return;
    cycles += 1;
    try {
      await runCycle({ batchSize, quiet: false });
    } catch (err) {
      console.error("Swarm cycle error:", err);
    }
    if (cycles < maxCycles) {
      setTimeout(() => void tick(), intervalMs);
    }
  };

  await tick();
}
