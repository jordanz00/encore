import { fileExists, rgFiles } from "../core/scan.js";
import { appendSummary, buildResult } from "./base.agent.js";
import type { AgentExecutionResult, Task } from "../core/types.js";

export async function mobileAgent(task: Task): Promise<AgentExecutionResult> {
  const summary: string[] = [];
  const riskFlags: string[] = [];

  if (!fileExists("apps/mobile/src/app/search.tsx")) {
    riskFlags.push("mobile_search_missing");
    appendSummary(summary, "Mobile search screen missing");
  }
  if (!fileExists("apps/mobile/src/app/artist/[slug].tsx")) {
    riskFlags.push("mobile_artist_missing");
    appendSummary(summary, "Mobile artist route missing");
  }
  if (!rgFiles("expo-av", "apps/mobile").length) {
    riskFlags.push("playback_missing");
    appendSummary(summary, "expo-av playback not detected");
  } else {
    appendSummary(summary, "expo-av playback detected");
  }

  return buildResult(task, riskFlags.length ? "blocked" : "complete", summary, [], {
    riskFlags,
  });
}
