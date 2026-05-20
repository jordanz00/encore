import { backlogOpenItems } from "../core/scan.js";
import { appendSummary, buildResult } from "./base.agent.js";
import type { Task } from "../core/types.js";
import type { AgentExecutionResult } from "../core/types.js";

export async function researchAgent(task: Task): Promise<AgentExecutionResult> {
  const summary: string[] = [];
  appendSummary(summary, "Research pass — no auto-patch (findings for next tasks)");

  const open = backlogOpenItems();
  appendSummary(summary, `BACKLOG open/partial rows: ${open.length}`);
  for (const row of open.slice(0, 6)) appendSummary(summary, row);

  appendSummary(summary, "Next: prod deploy, Stripe Connect E2E, Meilisearch indexer");

  return buildResult(task, "blocked", summary, [], {
    correctness: true,
    accessibility: true,
  });
}
