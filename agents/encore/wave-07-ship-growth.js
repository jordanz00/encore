/**
 * Wave 7 — Ship plan, growth, founder narrative
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var proposals = [];
  var wave = context.wave || 7;
  var ship = shared.readProjectFile("SHIP-PLAN-7-DAYS.md");
  var funding = shared.readProjectFile("FUNDING.md");
  var landing = shared.readProjectFile("landing.html");
  var deck = shared.readProjectFile("investor-deck.html");

  if (!ship) {
    return { proposals: [], log: [], summary: "Ship/Growth: SHIP-PLAN-7-DAYS.md missing." };
  }

  if (!/\[ \]/.test(ship)) {
    proposals.push(shared.createProposal("wave-07-ship-growth", wave, {
      changeType: "process",
      targetFile: "SHIP-PLAN-7-DAYS.md",
      description: "Add trackable checkboxes to ship plan §4 pre-launch checklist in repo issues",
      shipReadiness: 8
    }));
  }

  proposals.push(shared.createProposal("wave-07-ship-growth", wave, {
    changeType: "growth",
    targetFile: "apps/api/src/routes/waitlist.ts",
    description: "Waitlist endpoint + CSV export (ship day 1)",
    shipReadiness: 10,
    handlerKey: "stubs.waitlist-route",
    sources: ["SHIP-PLAN-7-DAYS.md Day 1"],
    instructions: ["POST /waitlist → waitlist table; admin export for launch audience."]
  }));

  proposals.push(shared.createProposal("wave-07-ship-growth", wave, {
    changeType: "growth",
    targetFile: "encore.audio/press",
    description: "Press kit page: logo, screenshots, founder bio, fact sheet (ship day 6)",
    shipReadiness: 9,
    designCraft: 7,
    handlerKey: "stubs.press-kit",
    sources: ["SHIP-PLAN-7-DAYS.md Day 6"]
  }));

  proposals.push(shared.createProposal("wave-07-ship-growth", wave, {
    changeType: "trust",
    targetFile: "transparency/index.html",
    description: "Transparency page stub for pool rates (ROADMAP v0.4)",
    economicsTrust: 8,
    shipReadiness: 8,
    handlerKey: "stubs.transparency-page",
    sources: ["ROADMAP.md v0.4"]
  }));

  if (landing && deck) {
    var landingAsk = (landing.match(/\$250K|\$250k/i) || [])[0];
    var deckAsk = (deck.match(/\$250K|\$250k/i) || [])[0];
    if (landingAsk && !deckAsk) {
      proposals.push(shared.createProposal("wave-07-ship-growth", wave, {
        changeType: "copy",
        targetFile: "investor-deck.html",
        description: "Sync patron round ask between landing and investor deck",
        economicsTrust: 8,
        shipReadiness: 8,
        sources: ["FUNDING.md"]
      }));
    }
  }

  if (funding && !/NLnet|fiscal sponsor/i.test(funding)) {
    proposals.push(shared.createProposal("wave-07-ship-growth", wave, {
      changeType: "documentation",
      targetFile: "FUNDING.md",
      description: "Document NLnet NGI0 + fiscal sponsor path (ship day 2)",
      shipReadiness: 9,
      sources: ["PLATFORM-SUCCESS-STRATEGY.md", "SHIP-PLAN-7-DAYS.md Day 2"]
    }));
  }

  proposals.push(shared.createProposal("wave-07-ship-growth", wave, {
    changeType: "growth",
    targetFile: "docs/",
    description: "Onboard 5 cornerstone artists with 2+ releases each (ship day 3 — highest risk)",
    artistImpact: 10,
    shipReadiness: 10,
    sources: ["SHIP-PLAN-7-DAYS.md Day 3", "PLATFORM-SUCCESS-STRATEGY.md §6"]
  }));

  return {
    proposals: proposals,
    log: [{ action: "complete", proposals: proposals.length }],
    summary: "Ship/Growth: " + proposals.length + " proposal(s)."
  };
}

module.exports = { run: run };
