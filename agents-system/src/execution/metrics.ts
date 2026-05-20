import type { ExecutionResult, SystemImpact, Task, TaskMetrics } from "../core/types.js";

const IMPACT_MULTIPLIER: Record<SystemImpact, number> = {
  low: 1,
  medium: 2,
  high: 4,
};

/** Rough cost units for investor dashboards (not billing). */
export function computeTaskMetrics(
  task: Task,
  result: ExecutionResult,
  durationMs: number,
): TaskMetrics {
  const patchBytes = result.patch.files.reduce(
    (n, f) => n + Buffer.byteLength(f.diff, "utf8"),
    0,
  );
  const mult = IMPACT_MULTIPLIER[task.context.systemImpact];
  const operationCostUnits =
    1 + result.patch.files.length * 0.5 + (patchBytes / 10_000) * mult;

  return {
    taskId: task.id,
    domain: task.domain,
    durationMs,
    patchFileCount: result.patch.files.length,
    patchBytes,
    systemImpact: task.context.systemImpact,
    operationCostUnits: Math.round(operationCostUnits * 100) / 100,
    status: result.status,
    costAware: task.constraints.costAware,
  };
}
