import { readText, rgFiles } from "../core/scan.js";
import { appendSummary, buildResult, writeFilePatch } from "./base.agent.js";
import type { AgentExecutionResult, PatchFile, Task } from "../core/types.js";

/**
 * If layout lacks skip link, emit a deterministic WRITE patch (safe, a11y-only).
 */
function skipLinkPatch(): PatchFile | null {
  const layoutPath = "apps/web/src/app/layout.tsx";
  const content = readText(layoutPath);
  if (!content) return null;
  if (content.includes("skip-to-main") || content.includes("Skip to main")) {
    return null;
  }
  const insert = `      <a href="#main-content" className="encore-skip-link">
        Skip to main content
      </a>\n`;
  const needle = "<body";
  const idx = content.indexOf(needle);
  if (idx < 0) return null;
  const close = content.indexOf(">", idx);
  if (close < 0) return null;
  const updated =
    content.slice(0, close + 1) + "\n" + insert + content.slice(close + 1);
  const mainNeedle = '<main className="flex-1"';
  const withMain = updated.includes("id=\"main-content\"")
    ? updated
    : updated.replace(mainNeedle, '<main id="main-content" className="flex-1"');
  return writeFilePatch(layoutPath, withMain);
}

export async function accessibilityAgent(task: Task): Promise<AgentExecutionResult> {
  const summary: string[] = [];
  const riskFlags: string[] = [];
  const files: PatchFile[] = [];

  const innerHtml = rgFiles("\\.innerHTML\\s*=", "apps/web");
  if (innerHtml.length) {
    appendSummary(summary, `innerHTML in web (${innerHtml.length}) — blocked until removed`);
    riskFlags.push("innerHTML");
  }

  const globals = readText("apps/web/src/app/globals.css");
  if (!globals?.includes("prefers-reduced-motion")) {
    riskFlags.push("missing_reduced_motion");
    appendSummary(summary, "Missing prefers-reduced-motion in globals.css");
  } else {
    appendSummary(summary, "prefers-reduced-motion present");
  }

  const skip = skipLinkPatch();
  if (skip) {
    appendSummary(summary, "Emitting skip-link patch for layout.tsx");
    files.push(skip);
  } else {
    appendSummary(summary, "Skip link already present or layout not patchable");
  }

  const status =
    riskFlags.includes("innerHTML") && files.length === 0 ? "blocked" : "complete";

  return buildResult(task, status, summary, files, {
    accessibility: !riskFlags.includes("innerHTML"),
    riskFlags,
  });
}
