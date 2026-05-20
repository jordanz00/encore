/**
 * Wave 10 — Founder experience auditor (product + trust + ship readiness)
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var landing = shared.readProjectFile("landing.html");
  var ship = shared.readProjectFile("SHIP-PLAN-7-DAYS.md");
  var approved = context.approvedProposals || [];
  var score = {
    artistClarity: 7,
    fanTrust: 7,
    designCalm: 6,
    shipReadiness: 6,
    founderStory: 8
  };
  var proposals = [];

  if (landing) {
    if (/Jordan Zabady|Founder/i.test(landing)) score.founderStory = 9;
    if (/0%\s*platform fee/i.test(landing)) score.artistClarity = 8;
    if (/Loud & Clear|IFPI|SoundOn/i.test(landing)) score.fanTrust = 8;
    if ((landing.match(/gradient/gi) || []).length > 5) score.designCalm = 5;
    if (/Try live player|showcase/i.test(landing)) score.shipReadiness = 7;
  }

  if (ship && /Day 7/.test(ship)) score.shipReadiness = Math.min(10, score.shipReadiness + 1);

  var avg = (
    score.artistClarity + score.fanTrust + score.designCalm +
    score.shipReadiness + score.founderStory
  ) / 5;

  if (score.designCalm < 7) {
    proposals.push(shared.createProposal("wave-10-founder-auditor", 10, {
      changeType: "design-review",
      targetFile: "landing.html",
      description: "Founder audit: simplify visual noise before patron/investor traffic",
      designCraft: 9,
      artistImpact: 6,
      shipReadiness: 8,
      instructions: ["Jobs test: remove one element per hero section.", "Ive test: one accent, more whitespace."]
    }));
  }

  if (approved.length < 5) {
    proposals.push(shared.createProposal("wave-10-founder-auditor", 10, {
      changeType: "process",
      targetFile: "agents/encore/run-waves.js",
      description: "Re-run waves after applying top approved proposals",
      shipReadiness: 7
    }));
  }

  return {
    proposals: proposals,
    log: [{ action: "complete", founderScore: score, average: avg }],
    summary: "Founder auditor: avg " + Math.round(avg * 10) / 10 + "/10 across 5 dimensions.",
    founderScore: score,
    founderAverage: Math.round(avg * 10) / 10,
    approvedCount: approved.length
  };
}

module.exports = { run: run };
