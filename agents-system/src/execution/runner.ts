import { researchAgent } from "../agents/research.agent.js";
import { backendAgent } from "../agents/backend.agent.js";
import { frontendAgent } from "../agents/frontend.agent.js";
import { mobileAgent } from "../agents/mobile.agent.js";
import { accessibilityAgent } from "../agents/accessibility.agent.js";
import { mediaAgent } from "../agents/media.agent.js";
import type { AgentPartialResult, ExecutionResult, Task, TaskTraceLog } from "../core/types.js";
import { computeTaskMetrics } from "./metrics.js";

export const runner = {
  async execute(task: Task, cycleId: string): Promise<ExecutionResult> {
    return runAgent(task, cycleId);
  },
};

export async function runAgent(task: Task, cycleId: string): Promise<ExecutionResult> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const traceLines: string[] = [`execute domain=${task.domain}`];

  try {
    let partial: AgentPartialResult;
    switch (task.domain) {
      case "research":
        partial = await researchAgent(task);
        break;
      case "backend":
        partial = await backendAgent(task);
        break;
      case "frontend":
        partial = await frontendAgent(task);
        break;
      case "mobile":
        partial = await mobileAgent(task);
        break;
      case "accessibility":
        partial = await accessibilityAgent(task);
        break;
      case "media":
        partial = await mediaAgent(task);
        break;
      default:
        throw new Error(`unknown_domain: ${task.domain}`);
    }
    for (const line of partial.summary) traceLines.push(line);
    const outcome: TaskTraceLog["outcome"] =
      partial.status === "complete" ? "complete" : "blocked";
    return finalizeResult(task, cycleId, partial, startedAt, t0, traceLines, outcome);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    traceLines.push(`ERROR: ${msg}`);
    const partial = {
      taskId: task.id,
      domain: task.domain,
      status: "blocked" as const,
      summary: [msg],
      patch: { files: [] },
      validation: {
        accessibility: false,
        correctness: false,
        simplicity: false,
        observability: false,
        unitEconomics: false,
        riskFlags: ["agent_exception"],
      },
    };
    return finalizeResult(task, cycleId, partial, startedAt, t0, traceLines, "blocked");
  }
}

function finalizeResult(
  task: Task,
  cycleId: string,
  partial: AgentPartialResult,
  startedAt: string,
  t0: number,
  traceLines: string[],
  outcome: TaskTraceLog["outcome"],
): ExecutionResult {
  const finishedAt = new Date().toISOString();
  const log: TaskTraceLog = {
    taskId: task.id,
    cycleId,
    domain: task.domain,
    objective: task.objective,
    startedAt,
    finishedAt,
    lines: traceLines,
    outcome,
  };
  const metrics = computeTaskMetrics(
    task,
    { ...partial, log, metrics: {} as ExecutionResult["metrics"] },
    Date.now() - t0,
  );
  return { ...partial, log, metrics };
}
