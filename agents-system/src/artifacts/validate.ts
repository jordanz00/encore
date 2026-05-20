import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../core/paths.js";
import type { TaskArtifactPaths } from "../core/types.js";

export interface ArtifactValidation {
  valid: boolean;
  missing: string[];
}

/** Every task must leave all four artifact files on disk. */
export function validateArtifactBundle(paths: TaskArtifactPaths): ArtifactValidation {
  const missing: string[] = [];
  const required: Array<keyof TaskArtifactPaths> = ["logs", "patches", "reports", "metrics"];

  for (const key of required) {
    const rel = paths[key];
    if (!rel) {
      missing.push(key);
      continue;
    }
    const abs = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(abs)) {
      missing.push(rel);
      continue;
    }
    if (fs.statSync(abs).size < 2) {
      missing.push(`${rel} (empty)`);
    }
  }

  if (!missing.length && paths.logs) {
    try {
      const log = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, paths.logs), "utf8")) as {
        lines?: unknown[];
      };
      if (!Array.isArray(log.lines) || log.lines.length === 0) {
        missing.push("log.lines empty");
      }
    } catch {
      missing.push("log invalid json");
    }
  }

  return { valid: missing.length === 0, missing };
}
