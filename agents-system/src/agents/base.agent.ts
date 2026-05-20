import type { ExecutionResult, PatchFile, Task, TaskDomain } from "../core/types.js";

export function buildResult(
  task: Task,
  status: "complete" | "blocked",
  summary: string[],
  files: PatchFile[] = [],
  opts?: {
    accessibility?: boolean;
    correctness?: boolean;
    simplicity?: boolean;
    observability?: boolean;
    riskFlags?: string[];
  },
): Omit<ExecutionResult, "log" | "metrics"> {
  return {
    taskId: task.id,
    domain: task.domain as TaskDomain,
    status,
    summary,
    patch: { files },
    validation: {
      accessibility: opts?.accessibility ?? true,
      correctness: opts?.correctness ?? true,
      simplicity: opts?.simplicity ?? true,
      observability: opts?.observability ?? true,
      unitEconomics: task.constraints.costAware,
      riskFlags: opts?.riskFlags ?? [],
    },
  };
}

/** Full-file write patch (validator + patcher WRITE_FILE format). */
export function writeFilePatch(relPath: string, content: string): PatchFile {
  return {
    path: relPath,
    diff: `--- WRITE_FILE\n+++ WRITE_FILE\n${content}`,
  };
}

export function appendSummary(lines: string[], line: string): void {
  lines.push(line);
}
