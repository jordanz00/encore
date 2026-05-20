import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { REPO_ROOT, SWARM_PATCH_STAGING } from "../core/paths.js";
import type { ApplyOutcome, PatchFile } from "../core/types.js";

function ensureStaging(): void {
  if (!fs.existsSync(SWARM_PATCH_STAGING)) {
    fs.mkdirSync(SWARM_PATCH_STAGING, { recursive: true });
  }
}

function resolveSafe(relPath: string): string | null {
  const normalized = relPath.replace(/^\/+/, "");
  if (normalized.includes("..")) return null;
  const abs = path.resolve(REPO_ROOT, normalized);
  if (!abs.startsWith(REPO_ROOT)) return null;
  return abs;
}

/** Full-file replace via diff marker `--- WRITE_FILE`. */
function isWriteFilePatch(diff: string): boolean {
  return diff.trimStart().startsWith("--- WRITE_FILE");
}

function applyWriteFile(relPath: string, diff: string): void {
  const abs = resolveSafe(relPath);
  if (!abs) throw new Error(`unsafe_path: ${relPath}`);
  const marker = "--- WRITE_FILE\n+++ WRITE_FILE\n";
  const idx = diff.indexOf(marker);
  const content = idx >= 0 ? diff.slice(idx + marker.length) : diff;
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
}

function applyUnifiedDiff(relPath: string, diff: string): void {
  const abs = resolveSafe(relPath);
  if (!abs) throw new Error(`unsafe_path: ${relPath}`);
  ensureStaging();
  const patchFile = path.join(SWARM_PATCH_STAGING, `${Date.now()}_${path.basename(relPath)}.patch`);
  fs.writeFileSync(patchFile, diff, "utf8");
  try {
    execSync(`git apply --whitespace=nowarn ${JSON.stringify(patchFile)}`, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });
  } finally {
    try {
      fs.unlinkSync(patchFile);
    } catch {
      /* ignore */
    }
  }
}

export const patcher = {
  async apply(files: PatchFile[]): Promise<ApplyOutcome> {
    const outcome: ApplyOutcome = { applied: [], skipped: [], errors: [] };
    if (!files.length) return outcome;

    for (const file of files) {
      try {
        if (isWriteFilePatch(file.diff)) {
          applyWriteFile(file.path, file.diff);
        } else {
          applyUnifiedDiff(file.path, file.diff);
        }
        outcome.applied.push(file.path);
      } catch (err) {
        outcome.errors.push(
          `${file.path}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    return outcome;
  },

  /** Dry-run only — does not modify working tree. */
  async check(files: PatchFile[]): Promise<{ ok: boolean; errors: string[] }> {
    const errors: string[] = [];
    for (const file of files) {
      const abs = resolveSafe(file.path);
      if (!abs) {
        errors.push(`unsafe_path: ${file.path}`);
        continue;
      }
      if (isWriteFilePatch(file.diff)) continue;
      ensureStaging();
      const patchFile = path.join(SWARM_PATCH_STAGING, `check_${path.basename(file.path)}.patch`);
      fs.writeFileSync(patchFile, file.diff, "utf8");
      try {
        execSync(`git apply --check ${JSON.stringify(patchFile)}`, {
          cwd: REPO_ROOT,
          encoding: "utf8",
          stdio: "pipe",
        });
      } catch (e) {
        errors.push(`${file.path}: git apply --check failed`);
      } finally {
        try {
          fs.unlinkSync(patchFile);
        } catch {
          /* ignore */
        }
      }
    }
    return { ok: errors.length === 0, errors };
  },
};
