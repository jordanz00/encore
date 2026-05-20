/**
 * Wave 5 — Catalog, ingest, federation
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var proposals = [];
  var wave = context.wave || 5;

  if (!shared.fileExists("packages/seed-catalog/package.json")) {
    proposals.push(shared.createProposal("wave-05-catalog-federation", wave, {
      changeType: "implementation",
      targetFile: "packages/seed-catalog/",
      description: "seed-catalog package required for 600+ day-one tracks",
      artistImpact: 8,
      shipReadiness: 10,
      sources: ["SHIP-PLAN-7-DAYS.md Day 2", "CATALOG-PATHS.md"]
    }));
  } else {
    proposals.push(shared.createProposal("wave-05-catalog-federation", wave, {
      changeType: "ops",
      targetFile: "packages/seed-catalog/",
      description: "Run production seed: FMA 200 + Internet Archive 200 + Jamendo 200",
      artistImpact: 9,
      shipReadiness: 10,
      sources: ["SHIP-PLAN-7-DAYS.md Day 2"],
      instructions: ["pnpm seed:catalog on beta DB before launch checklist."]
    }));
  }

  if (!shared.grepFile("packages/activitypub", /webfinger|HTTP Signature/i)) {
    proposals.push(shared.createProposal("wave-05-catalog-federation", wave, {
      changeType: "implementation",
      targetFile: "packages/activitypub/",
      description: "ActivityPub primitives must pass Mastodon interop on ship day 4",
      shipReadiness: 9,
      sources: ["docs/rfcs/005-federation.md", "SHIP-PLAN-7-DAYS.md Day 4"]
    }));
  } else {
    proposals.push(shared.createProposal("wave-05-catalog-federation", wave, {
      changeType: "verification",
      targetFile: "apps/api/src/routes/federation.ts",
      description: "Mastodon WebFinger + outbox publish test for cornerstone artist",
      shipReadiness: 9,
      sources: ["SHIP-PLAN-7-DAYS.md Day 4"]
    }));
  }

  if (!shared.grepFile("apps/api/src/routes", /subsonic|getArtists/i)) {
    proposals.push(shared.createProposal("wave-05-catalog-federation", wave, {
      changeType: "implementation",
      targetFile: "apps/api/src/routes/subsonic.ts",
      description: "Ship Subsonic API for Symfonium/play:Sub (day 4 gate)",
      artistImpact: 7,
      shipReadiness: 10,
      sources: ["ROADMAP.md v0.6", "SHIP-PLAN-7-DAYS.md Day 4"]
    }));
  }

  if (shared.fileExists("packages/ingest-ddex/package.json")) {
    proposals.push(shared.createProposal("wave-05-catalog-federation", wave, {
      changeType: "process",
      targetFile: "CATALOG-PATHS.md",
      description: "DDEX parser is real — schedule distributor pilot (v0.5), not ship-week blocker",
      artistImpact: 8,
      shipReadiness: 5,
      sources: ["CATALOG-PATHS.md", "docs/rfcs/002-ddex-ingest.md"]
    }));
  }

  return {
    proposals: proposals,
    log: [{ action: "complete", proposals: proposals.length }],
    summary: "Catalog/Federation: " + proposals.length + " proposal(s)."
  };
}

module.exports = { run: run };
