import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { REPO_ROOT } from "./paths.js";

/** Run ripgrep when available; returns matching file paths relative to repo root. */
export function rgFiles(pattern: string, searchPath: string): string[] {
  const abs = path.join(REPO_ROOT, searchPath);
  if (!fs.existsSync(abs)) return [];
  try {
    const out = execSync(`rg -l --glob '!node_modules' --glob '!.git' ${JSON.stringify(pattern)} ${JSON.stringify(abs)}`, {
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    });
    return out
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((p) => path.relative(REPO_ROOT, p));
  } catch {
    return [];
  }
}

export function readText(relPath: string): string | null {
  const abs = path.join(REPO_ROOT, relPath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, "utf8");
}

export function fileExists(relPath: string): boolean {
  return fs.existsSync(path.join(REPO_ROOT, relPath));
}

/** Extract markdown table rows with Status | Open or Partial */
export function backlogOpenItems(): string[] {
  const md = readText("docs/BACKLOG.md");
  if (!md) return [];
  const items: string[] = [];
  for (const line of md.split("\n")) {
    if (!line.startsWith("|")) continue;
    if (/Open|Partial/i.test(line) && !/^\| ID/i.test(line) && !/^\|[-]/.test(line)) {
      items.push(line.replace(/\|/g, " ").trim());
    }
  }
  return items.slice(0, 12);
}
