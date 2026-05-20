/**
 * Encore observable execution — task + result contracts.
 * No output without evidence (artifacts + audit).
 */
export type TaskDomain =
  | "research"
  | "backend"
  | "frontend"
  | "mobile"
  | "accessibility"
  | "media";

/** @deprecated use TaskDomain */
export type AgentKind = TaskDomain;

export type TaskState = "pending" | "running" | "completed" | "rejected" | "blocked";

export type SystemImpact = "low" | "medium" | "high";

/** Strict observable task constraints. */
export interface TaskConstraints {
  productionReady: boolean;
  accessibilityRequired: boolean;
  noFakeImplementations: boolean;
  costAware: boolean;
  /** Enforce design/encore-apple-system.css + motion tokens when true. */
  appleUIRequired?: boolean;
}

/** @deprecated alias */
export type CubanConstraints = TaskConstraints;

export interface TaskContext {
  filesTouched: string[];
  systemImpact: SystemImpact;
  /** @deprecated */ repoFiles?: string[];
  /** @deprecated */ dependencies?: string[];
  /** @deprecated */ riskLevel?: SystemImpact;
}

export interface Task {
  id: string;
  domain: TaskDomain;
  objective: string;
  constraints: TaskConstraints;
  context: TaskContext;
  state: TaskState;
  priority: number;
  createdAt: string;
  attempts: number;
}

export function taskAgent(task: Task): TaskDomain {
  return task.domain;
}

export interface PatchFile {
  path: string;
  diff: string;
}

export interface TaskTraceLog {
  taskId: string;
  cycleId: string;
  domain: TaskDomain;
  objective: string;
  startedAt: string;
  finishedAt: string;
  lines: string[];
  outcome: "complete" | "blocked" | "rejected" | "validated" | "applied";
}

export interface TaskMetrics {
  taskId: string;
  domain: TaskDomain;
  durationMs: number;
  patchFileCount: number;
  patchBytes: number;
  systemImpact: SystemImpact;
  /** Heuristic units for cost-awareness dashboards (not USD). */
  operationCostUnits: number;
  status: "complete" | "blocked";
  costAware: boolean;
}

export interface ValidationReport {
  taskId: string;
  cycleId: string;
  ok: boolean;
  reason?: string;
  gates: ValidationOutcome["gates"];
  checkedAt: string;
}

export interface ExecutionResult {
  taskId: string;
  domain: TaskDomain;
  status: "complete" | "blocked";
  summary: string[];
  patch: { files: PatchFile[] };
  log: TaskTraceLog;
  metrics: TaskMetrics;
  validation: {
    accessibility: boolean;
    correctness: boolean;
    simplicity: boolean;
    observability: boolean;
    unitEconomics: boolean;
    riskFlags: string[];
  };
}

/** Agent output before runner attaches log + metrics. */
export type AgentPartialResult = Omit<ExecutionResult, "log" | "metrics">;

/** @deprecated */ export type AgentExecutionResult = AgentPartialResult;

export interface ValidationOutcome {
  ok: boolean;
  reason?: string;
  gates: {
    correctness: boolean;
    simplicity: boolean;
    scalability: boolean;
    observability: boolean;
    accessibility: boolean;
    financial: boolean;
    unitEconomics: boolean;
    artifacts?: boolean;
    appleUI?: boolean;
  };
  report?: ValidationReport;
}

export interface ApplyOutcome {
  applied: string[];
  skipped: string[];
  errors: string[];
}

export interface TaskArtifactPaths {
  logs: string;
  patches: string;
  reports: string;
  metrics: string;
}

export interface CycleReport {
  cycleId: string;
  startedAt: string;
  finishedAt: string;
  tasksExecuted: number;
  patchesApplied: number;
  tasksRejected: number;
  tasksBlocked: number;
  results: ExecutionResult[];
  validation: ValidationOutcome[];
  riskReport: string[];
  remainingGaps: string[];
  nextHighestImpact: string[];
  cubanFilterNotes: string[];
  artifacts: TaskArtifactPaths[];
  cycleMetricsPath?: string;
  uiStatusPath?: string;
}

/** @deprecated */ export type CycleReportV3 = CycleReport;
