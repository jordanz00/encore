import fs from "node:fs";
import path from "node:path";
import { auditLog } from "./audit-log.js";
import { cubanFilterTask } from "./cuban-filter.js";
import { queue } from "./queue.js";
import {
  REPO_ROOT,
  SWARM_ARCHIVE_DIR,
  SWARM_LATEST_CYCLE,
  SWARM_LATEST_MD,
  SWARM_RISK_REPORT,
} from "./paths.js";
import type {
  CycleReport,
  ExecutionResult,
  Task,
  TaskArtifactPaths,
  TaskTraceLog,
  ValidationOutcome,
  ValidationReport,
} from "./types.js";
import { runner } from "../execution/runner.js";
import { validator } from "../execution/validator.js";
import { patcher } from "../execution/patcher.js";
import { backlogOpenItems } from "./scan.js";
import {
  ensureArtifactsReadme,
  writeCycleMetricsSnapshot,
  writeExecutionStatusForUI,
  writeTaskArtifactsOrThrow,
} from "../artifacts/writer.js";
import { computeTaskMetrics } from "../execution/metrics.js";

function ensureArchive(): void {
  if (!fs.existsSync(SWARM_ARCHIVE_DIR)) {
    fs.mkdirSync(SWARM_ARCHIVE_DIR, { recursive: true });
  }
}

export interface OrchestratorOptions {
  batchSize?: number;
  quiet?: boolean;
  applyPatches?: boolean;
}

function buildRejectionReport(
  task: Task,
  cycleId: string,
  reason: string,
  gates?: ValidationOutcome["gates"],
): ValidationReport {
  return {
    taskId: task.id,
    cycleId,
    ok: false,
    reason,
    gates: gates ?? {
      correctness: false,
      simplicity: true,
      scalability: true,
      observability: true,
      accessibility: true,
      financial: true,
      unitEconomics: true,
      artifacts: true,
      appleUI: true,
    },
    checkedAt: new Date().toISOString(),
  };
}

function persistEvidence(
  cycleId: string,
  task: Task,
  result: ExecutionResult,
  report: ValidationReport,
  outcome: TaskTraceLog["outcome"],
): TaskArtifactPaths {
  ensureArtifactsReadme();
  result.log.outcome = outcome;
  result.metrics = computeTaskMetrics(task, result, result.metrics.durationMs);
  return writeTaskArtifactsOrThrow({
    cycleId,
    taskId: task.id,
    log: result.log,
    patch: result.patch,
    report,
    metrics: result.metrics,
  });
}

function recordArtifacts(
  cycleId: string,
  task: Task,
  result: ExecutionResult,
  report: ValidationReport,
  outcome: TaskTraceLog["outcome"],
  quiet: boolean,
): TaskArtifactPaths | null {
  try {
    return persistEvidence(cycleId, task, result, report, outcome);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    auditLog.write("TASK_REJECTED", task.id, msg);
    if (!quiet) console.log(`  ✗ artifacts invalid: ${msg}`);
    return null;
  }
}

function shellResult(task: Task, cycleId: string, lines: string[], outcome: TaskTraceLog["outcome"]): ExecutionResult {
  const startedAt = new Date().toISOString();
  return {
    taskId: task.id,
    domain: task.domain,
    status: "blocked",
    summary: lines,
    patch: { files: [] },
    log: {
      taskId: task.id,
      cycleId,
      domain: task.domain,
      objective: task.objective,
      startedAt,
      finishedAt: new Date().toISOString(),
      lines,
      outcome,
    },
    metrics: computeTaskMetrics(
      task,
      {
        taskId: task.id,
        domain: task.domain,
        status: "blocked",
        summary: lines,
        patch: { files: [] },
        log: {} as TaskTraceLog,
        metrics: {} as ExecutionResult["metrics"],
        validation: {
          accessibility: true,
          correctness: false,
          simplicity: true,
          observability: true,
          unitEconomics: task.constraints.costAware,
          riskFlags: [],
        },
      },
      0,
    ),
    validation: {
      accessibility: true,
      correctness: false,
      simplicity: true,
      observability: true,
      unitEconomics: task.constraints.costAware,
      riskFlags: [],
    },
  };
}

/**
 * Observable execution cycle:
 * FETCH → EXECUTE → ARTIFACTS → VALIDATE → APPLY/REJECT → AUDIT
 */
export async function runCycle(opts: OrchestratorOptions = {}): Promise<CycleReport> {
  const batchSize = opts.batchSize ?? 5;
  const quiet = opts.quiet ?? false;
  const applyPatches = opts.applyPatches ?? process.env.SWARM_DRY_RUN !== "true";

  const cycleId = `cycle_${Date.now()}`;
  const startedAt = new Date().toISOString();
  auditLog.writeCycle(cycleId, "CYCLE_START");
  ensureArtifactsReadme();

  const tasks = await queue.getNextTasks(batchSize);
  const results: ExecutionResult[] = [];
  const validations: ValidationOutcome[] = [];
  const artifacts: TaskArtifactPaths[] = [];
  const riskReport: string[] = [];
  const cubanFilterNotes: string[] = [];
  let patchesApplied = 0;
  let tasksRejected = 0;
  let tasksBlocked = 0;
  let totalCostUnits = 0;

  if (!quiet) {
    console.log(`\n═══ Encore observable execution — ${cycleId} (${tasks.length} tasks) ═══\n`);
  }

  if (tasks.length === 0 && !quiet) {
    console.log("No pending tasks. Run: pnpm swarm:seed\n");
  }

  for (const task of tasks) {
    const cuban = cubanFilterTask(task);
    if (!cuban.proceed) {
      tasksRejected += 1;
      cubanFilterNotes.push(`${task.id}: ${cuban.reason}`);
      const reason = `cuban_filter: ${cuban.reason}`;
      auditLog.write("TASK_REJECTED", task.id, reason);
      const result = shellResult(task, cycleId, [reason], "rejected");
      const report = buildRejectionReport(task, cycleId, reason);
      const paths = recordArtifacts(cycleId, task, result, report, "rejected", quiet);
      if (paths) artifacts.push(paths);
      else tasksRejected += 1;
      await queue.requeue(task);
      if (!quiet) console.log(`→ [${task.domain}] SKIP (cuban): ${cuban.reason}`);
      continue;
    }

    auditLog.write("TASK_START", task.id, task.objective, { domain: task.domain, cycleId });
    if (!quiet) console.log(`→ [${task.domain}] ${task.objective}`);

    const result = await runner.execute(task, cycleId);
    results.push(result);
    totalCostUnits += result.metrics.operationCostUnits;
    auditLog.write("TASK_AGENT_DONE", task.id, result.status, {
      summaryCount: result.summary.length,
      patchFiles: result.patch.files.length,
      costUnits: result.metrics.operationCostUnits,
    });

    if (result.status === "blocked") {
      tasksBlocked += 1;
      auditLog.write("TASK_BLOCKED", task.id, result.summary.join("; "));
      const report = buildRejectionReport(task, cycleId, result.summary.join("; "));
      const blockedPaths = recordArtifacts(cycleId, task, result, report, "blocked", quiet);
      if (blockedPaths) artifacts.push(blockedPaths);
      await queue.block(task);
      for (const s of result.summary) riskReport.push(`[${task.domain}] ${s}`);
      for (const f of result.validation.riskFlags) riskReport.push(`[risk] ${f}`);
      if (!quiet) console.log(`  ⊘ blocked — artifacts written`);
      continue;
    }

    const valid = await validator.check(task, result, cycleId);
    validations.push(valid);

    if (!valid.ok) {
      tasksRejected += 1;
      auditLog.write("TASK_REJECTED", task.id, valid.reason);
      const report = valid.report ?? buildRejectionReport(task, cycleId, valid.reason ?? "rejected", valid.gates);
      const rejPaths = recordArtifacts(cycleId, task, result, report, "rejected", quiet);
      if (rejPaths) artifacts.push(rejPaths);
      else tasksRejected += 1;
      await queue.requeue(task);
      riskReport.push(`[rejected ${task.id}] ${valid.reason}`);
      if (!quiet) console.log(`  ✗ rejected: ${valid.reason}`);
      continue;
    }

    auditLog.write("TASK_VALIDATED", task.id);
    const passReport = valid.report!;

    if (result.patch.files.length === 0) {
      auditLog.write("TASK_PATCH_SKIPPED", task.id, "no files in patch");
      const valPaths = recordArtifacts(cycleId, task, result, passReport, "validated", quiet);
      if (!valPaths) {
        tasksRejected += 1;
        await queue.requeue(task);
        continue;
      }
      artifacts.push(valPaths);
      await queue.complete(task);
      auditLog.write("TASK_COMPLETE", task.id);
      if (!quiet) console.log(`  ✓ complete (evidence only, no patch)`);
      continue;
    }

    if (applyPatches) {
      const applied = await patcher.apply(result.patch.files);
      if (applied.errors.length) {
        tasksRejected += 1;
        const reason = applied.errors.join("; ");
        auditLog.write("TASK_REJECTED", task.id, reason);
        const report = buildRejectionReport(task, cycleId, reason);
        const applyRej = recordArtifacts(cycleId, task, result, report, "rejected", quiet);
        if (applyRej) artifacts.push(applyRej);
        else tasksRejected += 1;
        await queue.requeue(task);
        riskReport.push(...applied.errors.map((e) => `[apply] ${e}`));
        if (!quiet) console.log(`  ✗ apply failed: ${applied.errors[0]}`);
        continue;
      }
      patchesApplied += applied.applied.length;
      auditLog.write("TASK_PATCH_APPLIED", task.id, applied.applied.join(", "));
      const appliedPaths = recordArtifacts(cycleId, task, result, passReport, "applied", quiet);
      if (!appliedPaths) {
        tasksRejected += 1;
        await queue.requeue(task);
        continue;
      }
      artifacts.push(appliedPaths);
      if (!quiet) console.log(`  ✓ applied ${applied.applied.length} file(s) + artifacts`);
    } else {
      auditLog.write("TASK_PATCH_SKIPPED", task.id, "dry-run");
      const dryPaths = recordArtifacts(cycleId, task, result, passReport, "validated", quiet);
      if (!dryPaths) {
        tasksRejected += 1;
        await queue.requeue(task);
        continue;
      }
      artifacts.push(dryPaths);
      if (!quiet) console.log(`  ○ dry-run — artifacts at data/swarm/artifacts/`);
    }

    await queue.complete(task);
    auditLog.write("TASK_COMPLETE", task.id);
  }

  const open = backlogOpenItems();
  const remainingGaps = open.length ? open.slice(0, 8) : riskReport.slice(0, 8);
  const nextHighestImpact =
    open[0]?.trim() || (riskReport[0] ?? "Production deploy + db migrate (0004, 0005)");

  const cycleMetricsPath = writeCycleMetricsSnapshot(cycleId, {
    cycleId,
    startedAt,
    finishedAt: new Date().toISOString(),
    tasksExecuted: tasks.length,
    patchesApplied,
    tasksRejected,
    tasksBlocked,
    totalOperationCostUnits: Math.round(totalCostUnits * 100) / 100,
    artifactCount: artifacts.length,
  });

  const report: CycleReport = {
    cycleId,
    startedAt,
    finishedAt: new Date().toISOString(),
    tasksExecuted: tasks.length,
    patchesApplied,
    tasksRejected,
    tasksBlocked,
    results,
    validation: validations,
    riskReport,
    remainingGaps,
    nextHighestImpact,
    cubanFilterNotes,
    artifacts,
    cycleMetricsPath,
    uiStatusPath,
  };

  ensureArchive();
  fs.writeFileSync(SWARM_LATEST_CYCLE, JSON.stringify(report, null, 2) + "\n", "utf8");
  fs.writeFileSync(
    path.join(SWARM_ARCHIVE_DIR, `${cycleId}.json`),
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );
  writeCycleMarkdown(report);
  const uiStatusPath = writeExecutionStatusForUI(report);
  auditLog.writeCycle(cycleId, "CYCLE_END", `${patchesApplied} patches, ${tasksRejected} rejected`);

  if (!quiet) {
    console.log(`\nAudit:     data/swarm/audit.jsonl`);
    console.log(`Artifacts: data/swarm/artifacts/{logs,patches,reports,metrics}/${cycleId}/`);
    console.log(`Metrics:   ${cycleMetricsPath}`);
    console.log(`UI status: ${uiStatusPath}`);
    console.log(`Report:    ${path.relative(REPO_ROOT, SWARM_LATEST_MD)}\n`);
  }

  return report;
}

/** @deprecated */ export const runOrchestratorCycle = runCycle;

function writeCycleMarkdown(report: CycleReport): void {
  const lines: string[] = [
    `# Execution cycle ${report.cycleId}`,
    ``,
    `## Tasks`,
    `${report.tasksExecuted} (${report.tasksBlocked} blocked, ${report.tasksRejected} rejected)`,
    ``,
    `## Patches applied`,
    `${report.patchesApplied}`,
    ``,
    `## Observable artifacts`,
    `${report.artifacts.length} task bundles + cycle metrics: \`${report.cycleMetricsPath ?? "n/a"}\``,
    ``,
    `Inspect: \`data/swarm/artifacts/logs/${report.cycleId}/\``,
    ``,
    `## Validation`,
  ];
  for (const v of report.validation) {
    lines.push(`- ${v.ok ? "PASS" : "FAIL"}${v.reason ? `: ${v.reason}` : ""}`);
  }
  if (report.cubanFilterNotes.length) {
    lines.push(``, `## Cuban filter (skipped)`);
    for (const n of report.cubanFilterNotes) lines.push(`- ${n}`);
  }
  lines.push(``, `## Risk report`);
  for (const r of report.riskReport.slice(0, 20)) lines.push(`- ${r}`);
  lines.push(``, `## Remaining gaps`);
  for (const g of report.remainingGaps) lines.push(`- ${g}`);
  lines.push(``, `## Next highest-impact`, `- ${report.nextHighestImpact}`, ``);
  for (const r of report.results) {
    lines.push(`### ${r.domain} (${r.status})`);
    for (const s of r.summary) lines.push(`- ${s}`);
    if (r.patch.files.length) {
      lines.push(`**Patches:** ${r.patch.files.map((f) => f.path).join(", ")}`);
    }
    lines.push("");
  }
  fs.writeFileSync(SWARM_LATEST_MD, lines.join("\n"), "utf8");
  fs.writeFileSync(
    SWARM_RISK_REPORT,
    lines.slice(lines.indexOf("## Risk report")).join("\n"),
    "utf8",
  );
}
