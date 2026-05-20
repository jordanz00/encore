import { fileExists, rgFiles } from "../core/scan.js";
import { appendSummary, buildResult } from "./base.agent.js";
import type { AgentExecutionResult, Task } from "../core/types.js";

export async function frontendAgent(task: Task): Promise<AgentExecutionResult> {
  const summary: string[] = [];
  const riskFlags: string[] = [];

  const jsonDump = rgFiles("JSON\\.stringify\\(it", "apps/web");
  if (jsonDump.length) {
    appendSummary(summary, "Placeholder search UI still using JSON.stringify");
    riskFlags.push("search_not_wired");
  } else {
    appendSummary(summary, "Search UI appears wired (no JSON.stringify dump)");
  }

  if (!fileExists("apps/web/src/components/StripeConnectPanel.tsx")) {
    appendSummary(summary, "Missing StripeConnectPanel");
    riskFlags.push("connect_ui_missing");
  }

  for (const route of ["editorial", "playlist", "podcast"]) {
    if (fileExists(`apps/web/src/app/${route}/page.tsx`)) {
      appendSummary(summary, `Route shell: /${route} — verify API wiring`);
    }
  }

  if (task.constraints.appleUIRequired) {
    if (!fileExists("packages/ui-system/src/tokens/motion.ts")) {
      appendSummary(summary, "BLOCKER: @encore/ui-system tokens missing");
      riskFlags.push("ui_system_missing");
    } else {
      appendSummary(summary, "@encore/ui-system package present");
    }
    if (!fileExists("packages/ui-system/src/components/player.tsx")) {
      riskFlags.push("ui_system_player_missing");
    }
    if (!fileExists("apps/web/src/app/system/page.tsx")) {
      riskFlags.push("execution_status_ui_missing");
      appendSummary(summary, "WARN: /system execution status page missing");
    }
  }

  const blocked = riskFlags.some(
    (f) =>
      f === "ui_system_missing" ||
      f === "connect_ui_missing" ||
      f.startsWith("missing_"),
  );
  return buildResult(task, blocked ? "blocked" : "complete", summary, [], {
    accessibility: task.constraints.accessibilityRequired,
    riskFlags,
  });
}
