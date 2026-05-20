#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { taskStore } from "../core/task-store.js";
import { auditLog } from "../core/audit-log.js";
import { listRecentArtifacts } from "../artifacts/writer.js";
import { SWARM_LATEST_CYCLE, SWARM_AUDIT_LOG, ARTIFACTS_ROOT } from "../core/paths.js";

console.log("Task store:", taskStore.counts());
console.log("Recent audit:", auditLog.tail(5).map((e) => `${e.event} ${e.taskId ?? ""}`).join(" | "));

if (fs.existsSync(SWARM_LATEST_CYCLE)) {
  const raw = JSON.parse(fs.readFileSync(SWARM_LATEST_CYCLE, "utf8")) as {
    cycleId: string;
    tasksExecuted: number;
    patchesApplied: number;
    finishedAt: string;
    artifacts?: unknown[];
    cycleMetricsPath?: string;
  };
  console.log(
    `Latest: ${raw.cycleId} — ${raw.tasksExecuted} tasks, ${raw.patchesApplied} patches @ ${raw.finishedAt}`,
  );
  if (raw.artifacts?.length) {
    console.log(`Artifacts: ${raw.artifacts.length} task bundles`);
  }
  if (raw.cycleMetricsPath) {
    console.log(`Cycle metrics: ${raw.cycleMetricsPath}`);
  }
} else {
  console.log("No cycle yet. pnpm swarm:seed && pnpm swarm:cycle");
}

if (fs.existsSync(SWARM_AUDIT_LOG)) {
  const lines = fs.readFileSync(SWARM_AUDIT_LOG, "utf8").trim().split("\n").length;
  console.log(`Audit log lines: ${lines}`);
}

if (fs.existsSync(ARTIFACTS_ROOT)) {
  console.log("\nRecent artifacts (investor inspect):");
  for (const kind of ["logs", "reports", "metrics", "patches"] as const) {
    const files = listRecentArtifacts(kind, 2);
    for (const f of files) console.log(`  ${kind}: ${f}`);
  }
} else {
  console.log("\nNo artifacts yet — run pnpm swarm:cycle");
}

const readme = path.join(ARTIFACTS_ROOT, "README.md");
if (fs.existsSync(readme)) {
  console.log(`\nGuide: ${readme}`);
}
