import { fileExists, rgFiles } from "../core/scan.js";
import { appendSummary, buildResult } from "./base.agent.js";
import type { AgentExecutionResult, Task } from "../core/types.js";

export async function mediaAgent(task: Task): Promise<AgentExecutionResult> {
  const summary: string[] = [];
  const riskFlags: string[] = [];

  if (!fileExists("apps/worker/src/jobs/outbox.ts")) {
    riskFlags.push("outbox_missing");
  } else if (!rgFiles("remote_followers", "apps/worker/src/jobs/outbox.ts").length) {
    riskFlags.push("outbox_wrong_follower_query");
    appendSummary(summary, "Outbox may not target remote_followers inboxes");
  } else {
    appendSummary(summary, "Outbox fanout uses remote_followers");
  }

  if (!rgFiles("hls\\.js", "apps/web").length) {
    riskFlags.push("web_hls_missing");
    appendSummary(summary, "Web HLS.js not detected in player");
  }

  return buildResult(task, riskFlags.length ? "blocked" : "complete", summary, [], { riskFlags });
}
