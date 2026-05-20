/**
 * Wave 4 — Platform engineering (API, worker, infra)
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var proposals = [];
  var wave = context.wave || 4;

  if (!shared.fileExists("apps/api/package.json")) {
    return { proposals: [], log: [], summary: "Platform: apps/api missing." };
  }

  if (!shared.grepFile("apps/api/src", /\/health|health/)) {
    proposals.push(shared.createProposal("wave-04-platform", wave, {
      changeType: "implementation",
      targetFile: "apps/api/src/routes/health.ts",
      description: "Expose /health with version SHA for ship checklist",
      shipReadiness: 10,
      securityPrivacy: 7,
      sources: ["SHIP-PLAN-7-DAYS.md §4 pre-launch checklist"]
    }));
  }

  if (!shared.fileExists("infra/docker/docker-compose.yml")) {
    proposals.push(shared.createProposal("wave-04-platform", wave, {
      changeType: "infra",
      targetFile: "infra/docker/docker-compose.yml",
      description: "Production docker-compose path documented for Hetzner ship day 1",
      shipReadiness: 10,
      sources: ["SHIP-PLAN-7-DAYS.md Day 1"]
    }));
  }

  if (!shared.grepFile("apps/worker", /ffmpeg|transcode/i)) {
    proposals.push(shared.createProposal("wave-04-platform", wave, {
      changeType: "implementation",
      targetFile: "apps/worker/",
      description: "Verify ffmpeg transcode pipeline wired for upload → HLS + FLAC",
      artistImpact: 8,
      shipReadiness: 9,
      sources: ["docs/rfcs/003-audio-quality.md"]
    }));
  } else {
    proposals.push(shared.createProposal("wave-04-platform", wave, {
      changeType: "ops",
      targetFile: "infra/docker/docker-compose.yml",
      description: "Plan horizontal worker scaling after ~50 concurrent uploads (ship week risk)",
      shipReadiness: 8,
      sources: ["SHIP-PLAN-7-DAYS.md §6"],
      instructions: ["Document CCX33 upgrade trigger in ops runbook."]
    }));
  }

  if (!shared.grepFile("apps/web", /HLS|hls\.js/i)) {
    proposals.push(shared.createProposal("wave-04-platform", wave, {
      changeType: "implementation",
      targetFile: "apps/web/",
      description: "Add HLS.js fallback for non-Safari browsers (ROADMAP v0.1)",
      artistImpact: 7,
      designCraft: 6,
      shipReadiness: 7,
      sources: ["ROADMAP.md v0.1"]
    }));
  }

  return {
    proposals: proposals,
    log: [{ action: "complete", proposals: proposals.length }],
    summary: "Platform: " + proposals.length + " proposal(s)."
  };
}

module.exports = { run: run };
