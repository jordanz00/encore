/**
 * Mark Cuban reality filter — pre-execution value gate.
 * Unclear ROI → do not run task.
 */
import type { Task } from "./types.js";

export interface CubanFilterResult {
  proceed: boolean;
  scores: {
    unitEconomics: "clear" | "unclear";
    operationalComplexity: "reduces" | "neutral" | "increases";
    reliability: "improves" | "neutral" | "risk";
    userValue: "clear" | "unclear";
    scaleCost: "linear" | "unclear" | "exponential";
  };
  reason?: string;
}

const RESEARCH_OK = /^scan|audit|backlog|verify/i;
const HIGH_COST_PATTERNS = [
  /redis/i,
  /kubernetes/i,
  /microservice/i,
  /rewrite entire/i,
  /ml model/i,
  /infinite loop/i,
  /autonomous/i,
];

export function cubanFilterTask(task: Task): CubanFilterResult {
  const obj = task.objective.toLowerCase();
  const impact = task.context.systemImpact;

  let unitEconomics: CubanFilterResult["scores"]["unitEconomics"] = "clear";
  let operationalComplexity: CubanFilterResult["scores"]["operationalComplexity"] =
    "neutral";
  let reliability: CubanFilterResult["scores"]["reliability"] = "neutral";
  let userValue: CubanFilterResult["scores"]["userValue"] = "clear";
  let scaleCost: CubanFilterResult["scores"]["scaleCost"] = "linear";

  if (HIGH_COST_PATTERNS.some((p) => p.test(obj))) {
    unitEconomics = "unclear";
    operationalComplexity = "increases";
    scaleCost = "exponential";
  }

  if (task.domain === "research") {
    if (!RESEARCH_OK.test(task.objective)) {
      userValue = "unclear";
    }
    operationalComplexity = "reduces";
  }

  if (!task.constraints.costAware) {
    unitEconomics = "unclear";
  }

  if (!task.constraints.productionReady) {
    userValue = "unclear";
  }

  if (task.domain === "backend" && /wallet|payment|ledger|stripe/i.test(obj)) {
    if (!task.constraints.costAware) {
      unitEconomics = "unclear";
      reliability = "risk";
    } else {
      reliability = "improves";
    }
  }

  if (task.domain === "accessibility" && task.constraints.accessibilityRequired) {
    userValue = "clear";
    reliability = "improves";
  }

  if (impact === "high" && task.domain !== "backend") {
    scaleCost = "unclear";
  }

  if (/stub|demo only|fake|mock production/i.test(obj)) {
    unitEconomics = "unclear";
    userValue = "unclear";
  }

  const proceed =
    unitEconomics === "clear" &&
    userValue === "clear" &&
    scaleCost !== "exponential" &&
    operationalComplexity !== "increases" &&
    reliability !== "risk";

  let reason: string | undefined;
  if (!proceed) {
    const parts: string[] = [];
    if (unitEconomics === "unclear") parts.push("unit economics unclear");
    if (userValue === "unclear") parts.push("user value unclear");
    if (scaleCost === "exponential") parts.push("scale cost risk");
    if (operationalComplexity === "increases") parts.push("adds complexity");
    if (reliability === "risk") parts.push("reliability risk");
    reason = parts.join("; ");
  }

  return {
    proceed,
    scores: {
      unitEconomics,
      operationalComplexity,
      reliability,
      userValue,
      scaleCost,
    },
    reason,
  };
}
