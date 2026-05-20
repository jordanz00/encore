/**
 * Wave 6 — Security, privacy, AGPL
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var proposals = [];
  var wave = context.wave || 6;
  var security = shared.readProjectFile("SECURITY.md");
  var schema = shared.readProjectFile("packages/db/src/schema.ts");

  if (!security) {
    proposals.push(shared.createProposal("wave-06-security-privacy", wave, {
      changeType: "documentation",
      targetFile: "SECURITY.md",
      description: "SECURITY.md must exist with security@ disclosure path",
      securityPrivacy: 10,
      shipReadiness: 8
    }));
  }

  if (schema && !/disableDetailedPlayTracking|disable_detailed_play/i.test(schema)) {
    proposals.push(shared.createProposal("wave-06-security-privacy", wave, {
      changeType: "implementation",
      targetFile: "packages/db/src/schema.ts",
      description: "Enforce default disableDetailedPlayTracking for recs-without-surveillance",
      securityPrivacy: 10,
      artistImpact: 7,
      sources: ["docs/roles/role-28.md"],
      instructions: ["Default true on users table; document in privacy policy."]
    }));
  }

  var apiJs = shared.readProjectFile("apps/api/src/index.ts") ||
    shared.readProjectFile("apps/api/src/app.ts");
  if (apiJs && /\.innerHTML\s*=/.test(apiJs)) {
    proposals.push(shared.createProposal("wave-06-security-privacy", wave, {
      changeType: "security",
      targetFile: "apps/api/src/",
      description: "Remove innerHTML usage in API layer",
      securityPrivacy: 10,
      shipReadiness: 7
    }));
  }

  proposals.push(shared.createProposal("wave-06-security-privacy", wave, {
    changeType: "process",
    targetFile: "SHIP-PLAN-7-DAYS.md",
    description: "Beta invite-code gate on signup (day 5) — anti-abuse before public scale",
    securityPrivacy: 8,
    shipReadiness: 9,
    sources: ["docs/roles/role-29.md", "SHIP-PLAN-7-DAYS.md Day 5"]
  }));

  if (!shared.fileExists("LICENSE")) {
    proposals.push(shared.createProposal("wave-06-security-privacy", wave, {
      changeType: "legal",
      targetFile: "LICENSE",
      description: "AGPL-3.0 LICENSE file required at repo root",
      securityPrivacy: 9,
      economicsTrust: 8
    }));
  }

  return {
    proposals: proposals,
    log: [{ action: "complete", proposals: proposals.length }],
    summary: "Security/Privacy: " + proposals.length + " proposal(s)."
  };
}

module.exports = { run: run };
