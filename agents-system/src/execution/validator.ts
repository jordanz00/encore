import path from "node:path";
import { REPO_ROOT } from "../core/paths.js";
import type { ExecutionResult, PatchFile, Task, ValidationOutcome } from "../core/types.js";
import { patcher } from "./patcher.js";
import { checkAppleUI } from "./apple-ui-gate.js";

const FINANCIAL_PATHS = [
  "apps/api/src/lib/wallet-ledger.ts",
  "apps/api/src/routes/payments.ts",
  "apps/api/src/routes/wallet.ts",
  "packages/db/src/schema.ts",
];

const UI_PATHS = ["apps/web/", "apps/mobile/", "design/"];

function isUiFile(p: string): boolean {
  return UI_PATHS.some((prefix) => p.startsWith(prefix));
}

function isFinancialFile(p: string): boolean {
  return FINANCIAL_PATHS.some((f) => p === f || p.startsWith(f));
}

function hasStubMarkers(diff: string): boolean {
  return /\b(TODO|FIXME|stub|placeholder)\b/i.test(diff);
}

function bracketBalanceOk(content: string): boolean {
  const opens = (content.match(/[{[(]/g) ?? []).length;
  const closes = (content.match(/[}\])]/g) ?? []).length;
  return Math.abs(opens - closes) <= 2;
}

function financialPatchSafe(diff: string): { ok: boolean; flags: string[] } {
  const flags: string[] = [];
  if (/balanceCents\s*=/.test(diff) && !/appendLedgerEntry/.test(diff)) {
    flags.push("direct_balance_mutation_without_ledger");
  }
  if (/platformFee(Percent|Cents)\s*=\s*[^0]/.test(diff)) {
    flags.push("nonzero_platform_fee");
  }
  if (/application_fee_amount:\s*[^0]/.test(diff) && !/application_fee_amount:\s*0/.test(diff)) {
    flags.push("nonzero_stripe_application_fee");
  }
  if (diff.includes("delete from wallet_ledger") || diff.includes("TRUNCATE")) {
    flags.push("ledger_destructive_sql");
  }
  return { ok: flags.length === 0, flags };
}

function accessibilityPatchSafe(filePath: string, diff: string): { ok: boolean; flags: string[] } {
  const flags: string[] = [];
  if (!isUiFile(filePath)) return { ok: true, flags };
  if (/\.innerHTML\s*=/.test(diff)) flags.push("innerHTML_injection");
  if (/aria-hidden="true"[^>]*>.*<\/button>/.test(diff) && !/aria-label=/.test(diff)) {
    flags.push("icon_button_missing_label");
  }
  if (diff.includes('role="button"') && diff.includes("<div") && !diff.includes("<button")) {
    flags.push("div_as_button");
  }
  return { ok: flags.length === 0, flags };
}

function simplicityOk(files: PatchFile[]): boolean {
  const totalLines = files.reduce((n, f) => n + f.diff.split("\n").length, 0);
  if (files.length > 12) return false;
  if (totalLines > 2500) return false;
  return true;
}

function observabilityOk(result: ExecutionResult): boolean {
  if (result.status === "blocked") return result.summary.length > 0;
  if (result.summary.length === 0) return false;
  if (!result.log?.lines?.length) return false;
  return true;
}

function validateResultShape(result: ExecutionResult): string[] {
  const issues: string[] = [];
  if (!result.taskId) issues.push("missing taskId");
  if (!result.domain) issues.push("missing domain");
  if (result.status !== "complete" && result.status !== "blocked") {
    issues.push("invalid status");
  }
  if (!Array.isArray(result.summary)) issues.push("summary must be array");
  if (!result.patch?.files || !Array.isArray(result.patch.files)) {
    issues.push("patch.files required");
  }
  if (!result.validation) issues.push("validation block required");
  if (!result.log) issues.push("execution log required");
  if (!result.metrics) issues.push("metrics required");
  return issues;
}

function failGate(
  taskId: string,
  cycleId: string,
  reason: string,
  partial: Partial<ValidationOutcome["gates"]>,
): ValidationOutcome {
  const gates: ValidationOutcome["gates"] = {
    correctness: partial.correctness ?? false,
    simplicity: partial.simplicity ?? true,
    scalability: partial.scalability ?? true,
    observability: partial.observability ?? true,
    accessibility: partial.accessibility ?? true,
    financial: partial.financial ?? true,
    unitEconomics: partial.unitEconomics ?? true,
    artifacts: partial.artifacts ?? true,
    appleUI: partial.appleUI ?? true,
  };
  return {
    ok: false,
    reason,
    gates,
    report: {
      taskId,
      cycleId,
      ok: false,
      reason,
      gates,
      checkedAt: new Date().toISOString(),
    },
  };
}

function passGates(taskId: string, cycleId: string): ValidationOutcome {
  const gates: ValidationOutcome["gates"] = {
    correctness: true,
    simplicity: true,
    scalability: true,
    observability: true,
    accessibility: true,
    financial: true,
    unitEconomics: true,
    artifacts: true,
    appleUI: true,
  };
  return {
    ok: true,
    gates,
    report: {
      taskId,
      cycleId,
      ok: true,
      gates,
      checkedAt: new Date().toISOString(),
    },
  };
}

export const validator = {
  async check(
    task: Task,
    result: ExecutionResult,
    cycleId: string,
  ): Promise<ValidationOutcome> {
    const shapeIssues = validateResultShape(result);
    if (shapeIssues.length) {
      return failGate(task.id, cycleId, shapeIssues.join("; "), { correctness: false });
    }

    if (result.status === "blocked") {
      return passGates(task.id, cycleId);
    }

    if (!observabilityOk(result)) {
      return failGate(task.id, cycleId, "no observable summary or log", { observability: false });
    }

    if (!result.validation.correctness) {
      return failGate(task.id, cycleId, "agent reported incorrect result", { correctness: false });
    }

    const apple = checkAppleUI(task);
    if (!apple.ok) {
      return failGate(task.id, cycleId, `apple UI gate: ${apple.flags.join(", ")}`, { appleUI: false });
    }

    const files = result.patch.files;
    if (!files.length) {
      return passGates(task.id, cycleId);
    }

    if (!simplicityOk(files)) {
      return failGate(task.id, cycleId, "patch too large for junior maintainability", {
        simplicity: false,
      });
    }

    for (const f of files) {
      const abs = path.resolve(REPO_ROOT, f.path);
      if (!abs.startsWith(REPO_ROOT) || f.path.includes("..")) {
        return failGate(task.id, cycleId, `unsafe path: ${f.path}`, {
          correctness: false,
          scalability: false,
        });
      }
      if (f.path.startsWith(".env")) {
        return failGate(task.id, cycleId, "cannot patch env files", { correctness: false });
      }
    }

    if (task.constraints.noFakeImplementations) {
      for (const f of files) {
        if (hasStubMarkers(f.diff)) {
          return failGate(task.id, cycleId, `stub marker in patch: ${f.path}`, {
            correctness: false,
          });
        }
      }
    }

    if (task.constraints.costAware) {
      for (const f of files) {
        if (isFinancialFile(f.path)) {
          const fin = financialPatchSafe(f.diff);
          if (!fin.ok) {
            return failGate(task.id, cycleId, `financial gate: ${fin.flags.join(", ")}`, {
              financial: false,
              unitEconomics: false,
            });
          }
        }
      }
    }

    if (task.constraints.accessibilityRequired) {
      for (const f of files) {
        const a11y = accessibilityPatchSafe(f.path, f.diff);
        if (!a11y.ok) {
          return failGate(task.id, cycleId, `accessibility gate: ${a11y.flags.join(", ")}`, {
            accessibility: false,
          });
        }
      }
    }

    for (const f of files) {
      if (f.path.endsWith(".ts") || f.path.endsWith(".tsx")) {
        if (!bracketBalanceOk(f.diff)) {
          return failGate(task.id, cycleId, `syntax imbalance: ${f.path}`, { correctness: false });
        }
      }
    }

    const gitCheck = await patcher.check(files);
    if (!gitCheck.ok) {
      return failGate(task.id, cycleId, gitCheck.errors.join("; "), { correctness: false });
    }

    return passGates(task.id, cycleId);
  },
};
