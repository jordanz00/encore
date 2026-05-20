import fs from "node:fs";
import path from "node:path";
import {
  ARTIFACTS_LOGS,
  ARTIFACTS_METRICS,
  ARTIFACTS_PATCHES,
  ARTIFACTS_REPORTS,
  ARTIFACTS_ROOT,
  REPO_ROOT,
} from "../core/paths.js";
import type { CycleReport, PatchFile, TaskMetrics, TaskTraceLog, ValidationReport } from "../core/types.js";
import { SWARM_UI_STATUS, SWARM_UI_STATUS_ARCHIVE } from "../core/paths.js";
import { validateArtifactBundle } from "./validate.js";

export type ArtifactKind = "logs" | "patches" | "reports" | "metrics";

const KIND_DIRS: Record<ArtifactKind, string> = {
  logs: ARTIFACTS_LOGS,
  patches: ARTIFACTS_PATCHES,
  reports: ARTIFACTS_REPORTS,
  metrics: ARTIFACTS_METRICS,
};

function ensureRoot(): void {
  for (const dir of Object.values(KIND_DIRS)) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

/** Persist inspectable evidence. Returns repo-relative path. */
export function writeArtifact(
  kind: ArtifactKind,
  taskId: string,
  cycleId: string,
  payload: unknown,
): string {
  ensureRoot();
  const dir = path.join(KIND_DIRS[kind], cycleId);
  fs.mkdirSync(dir, { recursive: true });
  const filename =
    kind === "patches" ? `${taskId}.patch.json` : `${taskId}.json`;
  const abs = path.join(dir, filename);
  fs.writeFileSync(abs, JSON.stringify(payload, null, 2) + "\n", "utf8");
  return path.relative(REPO_ROOT, abs);
}

/** Throws if any artifact file missing — task is INVALID without evidence. */
export function writeTaskArtifactsOrThrow(input: {
  cycleId: string;
  taskId: string;
  log: TaskTraceLog;
  patch: { files: PatchFile[] };
  report: ValidationReport;
  metrics: TaskMetrics;
}): Record<ArtifactKind, string> {
  const paths = writeTaskArtifacts(input);
  const check = validateArtifactBundle(paths);
  if (!check.valid) {
    throw new Error(`artifacts_incomplete: ${check.missing.join(", ")}`);
  }
  return paths;
}

export function writeTaskArtifacts(input: {
  cycleId: string;
  taskId: string;
  log: TaskTraceLog;
  patch: { files: PatchFile[] };
  report: ValidationReport;
  metrics: TaskMetrics;
}): Record<ArtifactKind, string> {
  return {
    logs: writeArtifact("logs", input.taskId, input.cycleId, input.log),
    patches: writeArtifact("patches", input.taskId, input.cycleId, {
      taskId: input.taskId,
      cycleId: input.cycleId,
      files: input.patch.files,
      fileCount: input.patch.files.length,
      totalDiffBytes: input.patch.files.reduce((n, f) => n + Buffer.byteLength(f.diff, "utf8"), 0),
    }),
    reports: writeArtifact("reports", input.taskId, input.cycleId, input.report),
    metrics: writeArtifact("metrics", input.taskId, input.cycleId, input.metrics),
  };
}

export function writeCycleMetricsSnapshot(
  cycleId: string,
  snapshot: Record<string, unknown>,
): string {
  ensureRoot();
  const abs = path.join(ARTIFACTS_METRICS, `${cycleId}.cycle.json`);
  fs.writeFileSync(abs, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  return path.relative(REPO_ROOT, abs);
}

export function listRecentArtifacts(kind: ArtifactKind, limit = 5): string[] {
  const base = KIND_DIRS[kind];
  if (!fs.existsSync(base)) return [];
  const cycles = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .reverse()
    .slice(0, 3);
  const out: string[] = [];
  for (const cycle of cycles) {
    const files = fs.readdirSync(path.join(base, cycle)).sort().reverse();
    for (const f of files.slice(0, limit)) {
      out.push(path.join("data", "swarm", "artifacts", kind, cycle, f));
    }
  }
  return out.slice(0, limit);
}

export function artifactsReadmePath(): string {
  return path.join(ARTIFACTS_ROOT, "README.md");
}

export function ensureArtifactsReadme(): void {
  const readme = artifactsReadmePath();
  if (fs.existsSync(readme)) return;
  ensureRoot();
  fs.writeFileSync(
    readme,
    `# Encore execution artifacts

Every task run writes evidence under this tree:

- \`logs/<cycleId>/<taskId>.json\` — execution trace
- \`patches/<cycleId>/<taskId>.patch.json\` — diffs (git-apply or WRITE_FILE)
- \`reports/<cycleId>/<taskId>.json\` — validation gates + outcome
- \`metrics/<cycleId>/<taskId>.json\` — duration, size, cost units
- \`metrics/<cycleId>.cycle.json\` — cycle rollup

Immutable audit: \`../audit.jsonl\`

No invisible work.

Apple UI tokens: \`design/encore-apple-system.css\`
`,
    "utf8",
  );
}

/** Real JSON for web /system page — not fabricated. */
export function writeExecutionStatusForUI(report: CycleReport): string {
  const tasks = report.results.map((r) => {
    const bundle = report.artifacts.find((a) => a.logs.includes(r.taskId));
    return {
      id: r.taskId,
      domain: r.domain,
      status: r.log.outcome,
      objective: r.log.objective,
      durationMs: r.metrics.durationMs,
      costUnits: r.metrics.operationCostUnits,
      artifacts: bundle ?? null,
    };
  });

  const payload = {
    _meta: {
      source: "agents-system/runCycle",
      cycleId: report.cycleId,
      updatedAt: report.finishedAt,
      validationStatus: "verified_from_cycle",
    },
    cycleId: report.cycleId,
    startedAt: report.startedAt,
    finishedAt: report.finishedAt,
    tasksExecuted: report.tasksExecuted,
    patchesApplied: report.patchesApplied,
    tasksRejected: report.tasksRejected,
    tasksBlocked: report.tasksBlocked,
    totalOperationCostUnits:
      report.results.reduce((n, r) => n + r.metrics.operationCostUnits, 0) || 0,
    tasks,
    nextHighestImpact: report.nextHighestImpact,
  };

  const dir = path.dirname(SWARM_UI_STATUS);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const json = JSON.stringify(payload, null, 2) + "\n";
  fs.writeFileSync(SWARM_UI_STATUS, json, "utf8");
  const archiveDir = path.dirname(SWARM_UI_STATUS_ARCHIVE);
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
  fs.writeFileSync(SWARM_UI_STATUS_ARCHIVE, json, "utf8");
  return path.relative(REPO_ROOT, SWARM_UI_STATUS);
}
