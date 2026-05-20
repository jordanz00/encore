import { fileExists, rgFiles } from "../core/scan.js";
import { appendSummary, buildResult } from "./base.agent.js";
import type { AgentExecutionResult, Task } from "../core/types.js";

export async function backendAgent(task: Task): Promise<AgentExecutionResult> {
  const summary: string[] = [];
  const riskFlags: string[] = [];

  if (!fileExists("apps/api/src/lib/stripe-connect.ts")) {
    appendSummary(summary, "BLOCKER: stripe-connect.ts missing");
    riskFlags.push("missing_connect_module");
  } else {
    appendSummary(summary, "stripe-connect.ts present");
  }

  if (!fileExists("packages/db/drizzle/0005_stripe_connect.sql")) {
    appendSummary(summary, "WARN: migration 0005_stripe_connect not found");
    riskFlags.push("migration_0005_missing");
  }

  const innerHtml = rgFiles("\\.innerHTML\\s*=", "apps/api");
  if (innerHtml.length) {
    appendSummary(summary, `SECURITY: innerHTML in API (${innerHtml.length} files)`);
    riskFlags.push("unsafe_dom_api");
  }

  if (task.constraints.costAware) {
    appendSummary(summary, "Cost-aware constraint — patches require ledger idempotency, 0% platform fee");
    if (!fileExists("apps/api/src/lib/wallet-ledger.ts")) {
      riskFlags.push("wallet_ledger_missing");
    }
  }

  const blocked = riskFlags.some((f) => f.startsWith("missing_"));
  return buildResult(task, blocked ? "blocked" : "complete", summary, [], {
    correctness: !blocked,
    riskFlags,
  });
}
