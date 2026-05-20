/**
 * Wave 8 — Documentation & role/RFC parity
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var proposals = [];
  var wave = context.wave || 8;
  var readme = shared.readProjectFile("README.md");
  var roadmap = shared.readProjectFile("ROADMAP.md");

  if (!readme || !/ARTIST-INCOME-GUARANTEE/.test(readme)) {
    proposals.push(shared.createProposal("wave-08-documentation", wave, {
      changeType: "documentation",
      targetFile: "README.md",
      description: "README must link ARTIST-INCOME-GUARANTEE as primary design contract",
      economicsTrust: 8,
      shipReadiness: 6
    }));
  }

  if (!shared.fileExists("docs/ENCORE-MULTI-AGENT-SYSTEM.md")) {
    proposals.push(shared.createProposal("wave-08-documentation", wave, {
      changeType: "documentation",
      targetFile: "docs/ENCORE-MULTI-AGENT-SYSTEM.md",
      description: "Add Encore multi-agent operating doc (this runner — standalone)",
      shipReadiness: 7,
      instructions: ["Document agents/encore/run-waves.js; no external project references."]
    }));
  }

  var rfcs = 0;
  for (var r = 1; r <= 8; r++) {
    var rn = r < 10 ? "0" + r : String(r);
    if (shared.fileExists("docs/rfcs/" + rn + "-") || shared.fileExists("docs/rfcs/00" + r + "-")) rfcs++;
  }
  ["001-stack.md", "002-ddex-ingest.md", "003-audio-quality.md", "004-recommendations.md",
    "005-federation.md", "006-payments-payouts.md", "007-apps.md", "008-funding-governance.md"
  ].forEach(function (f) {
    if (shared.fileExists("docs/rfcs/" + f)) rfcs++;
  });

  if (rfcs < 8) {
    proposals.push(shared.createProposal("wave-08-documentation", wave, {
      changeType: "documentation",
      targetFile: "docs/rfcs/",
      description: "RFC set incomplete (" + rfcs + "/8) — block architecture changes without RFC",
      shipReadiness: 6
    }));
  }

  if (roadmap && !/SHIP-PLAN-7-DAYS/.test(roadmap)) {
    proposals.push(shared.createProposal("wave-08-documentation", wave, {
      changeType: "documentation",
      targetFile: "ROADMAP.md",
      description: "ROADMAP should reference ship-week sprint at top",
      shipReadiness: 7
    }));
  }

  return {
    proposals: proposals,
    log: [{ action: "complete", proposals: proposals.length }],
    summary: "Documentation: " + proposals.length + " proposal(s)."
  };
}

module.exports = { run: run };
