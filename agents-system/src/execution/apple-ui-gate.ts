import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../core/paths.js";
import type { Task } from "../core/types.js";

const APPLE_CSS_PATHS = [
  "packages/ui-system/styles/ui-system.css",
  "packages/ui-system/src/tokens/motion.ts",
  "design/encore-apple-system.css",
  "apps/web/src/styles/ui-system.css",
];

const MOTION_TOKENS = ["--ease-out-apple", "prefers-reduced-motion", "--duration-ui"];

export function checkAppleUI(task: Task): { ok: boolean; flags: string[] } {
  if (!task.constraints.appleUIRequired) {
    return { ok: true, flags: [] };
  }

  const flags: string[] = [];

  for (const rel of APPLE_CSS_PATHS) {
    const abs = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(abs)) {
      flags.push(`missing_${rel.replace(/\//g, "_")}`);
      continue;
    }
    const css = fs.readFileSync(abs, "utf8");
    for (const token of MOTION_TOKENS) {
      if (!css.includes(token)) flags.push(`no_token_${token.replace(/[^a-z0-9]/gi, "_")}_in_${path.basename(rel)}`);
    }
  }

  const uiPkg = path.join(REPO_ROOT, "packages/ui-system/package.json");
  if (!fs.existsSync(uiPkg)) {
    flags.push("ui_system_package_missing");
  }

  const globals = path.join(REPO_ROOT, "apps/web/src/app/globals.css");
  if (fs.existsSync(globals)) {
    const g = fs.readFileSync(globals, "utf8");
    if (!g.includes("ui-system")) {
      flags.push("globals_missing_ui_system_import");
    }
  }

  const landing = path.join(REPO_ROOT, "design/landing.css");
  if (fs.existsSync(landing)) {
    const l = fs.readFileSync(landing, "utf8");
    if (!l.includes("--ease-out") && !l.includes("encore-apple")) {
      flags.push("landing_missing_motion_tokens");
    }
  }

  return { ok: flags.length === 0, flags };
}
