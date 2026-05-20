/**
 * Wave 2 — Competitive intelligence & positioning
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var proposals = [];
  var wave = context.wave || 2;
  var competitors = shared.readProjectFile("COMPETITORS.md");
  var strategy = shared.readProjectFile("PLATFORM-SUCCESS-STRATEGY.md");
  var rolesDir = shared.fileExists("docs/roles/role-01.md");

  if (!competitors) {
    return { proposals: [], log: [], summary: "Competitive: COMPETITORS.md missing." };
  }

  if (!/Resonate|Audius|Bandcamp|Spotify/i.test(competitors)) {
    proposals.push(shared.createProposal("wave-02-competitive", wave, {
      changeType: "documentation",
      targetFile: "COMPETITORS.md",
      description: "Ensure failure-mode competitors are documented with Encore counter-position",
      artistImpact: 7,
      economicsTrust: 7,
      shipReadiness: 5,
      sources: ["PLATFORM-SUCCESS-STRATEGY.md"]
    }));
  }

  if (strategy && /token/i.test(strategy) && /will not|never|forbid/i.test(strategy)) {
    proposals.push(shared.createProposal("wave-02-competitive", wave, {
      changeType: "copy",
      targetFile: "landing.html",
      description: "Surface anti-token / anti-acquisition stance on landing (differentiator vs Audius)",
      artistImpact: 8,
      economicsTrust: 8,
      designCraft: 7,
      shipReadiness: 7,
      sources: ["PLATFORM-SUCCESS-STRATEGY.md §9"],
      handlerKey: "landing.anti-token",
      instructions: ["One line near federation block: no creator coin, AGPL fork is the real Encore."]
    }));
  }

  if (rolesDir) {
    var roleCount = 0;
    for (var i = 1; i <= 30; i++) {
      var n = i < 10 ? "0" + i : String(i);
      if (shared.fileExists("docs/roles/role-" + n + ".md")) roleCount++;
    }
    if (roleCount < 30) {
      proposals.push(shared.createProposal("wave-02-competitive", wave, {
        changeType: "documentation",
        targetFile: "docs/roles/",
        description: "Only " + roleCount + "/30 role briefs present — restore full competitive audit set",
        artistImpact: 5,
        shipReadiness: 6
      }));
    }
  }

  proposals.push(shared.createProposal("wave-02-competitive", wave, {
    changeType: "process",
    targetFile: "docs/roles/role-01.md",
    description: "Quarterly refresh Spotify/Apple/Bandcamp audits (roles 01–04) after launch metrics",
    artistImpact: 6,
    economicsTrust: 6,
    shipReadiness: 4,
    instructions: ["Schedule post-beta competitive diff vs landing comparison table."]
  }));

  return {
    proposals: proposals,
    log: [{ action: "complete", proposals: proposals.length }],
    summary: "Competitive: " + proposals.length + " proposal(s)."
  };
}

module.exports = { run: run };
