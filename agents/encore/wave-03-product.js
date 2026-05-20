/**
 * Wave 3 — Product surfaces (landing, web, player)
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var proposals = [];
  var wave = context.wave || 3;
  var landing = shared.readProjectFile("landing.html");
  var webPkg = shared.readProjectFile("apps/web/package.json");
  var player = shared.readProjectFile("player/index.html") || shared.readProjectFile("apps/web/src/app/page.tsx");

  if (landing) {
    if (!/beta\.encore\.audio|localhost:3000/i.test(landing)) {
      proposals.push(shared.createProposal("wave-03-product", wave, {
        changeType: "ux",
        targetFile: "landing.html",
        description: "Hero CTA should point to live beta instance, not only static showcase player",
        artistImpact: 7,
        designCraft: 8,
        shipReadiness: 9,
        sources: ["SHIP-PLAN-7-DAYS.md §1"],
        handlerKey: "landing.beta-cta",
        instructions: ["Primary CTA: https://beta.encore.audio (or staging URL) with fallback to embedded player."]
      }));
    }
    if (/gradient|box-shadow:\s*0\s+8px\s+32px/i.test(landing)) {
      proposals.push(shared.createProposal("wave-03-product", wave, {
        changeType: "design",
        targetFile: "landing.html",
        description: "Reduce decorative gradients — align landing with calm single-accent system (packages/ui)",
        artistImpact: 5,
        designCraft: 9,
        shipReadiness: 7,
        instructions: ["Import tokens from packages/ui; one accent; more whitespace; fewer competing shadows."]
      }));
    }
  }

  if (webPkg && !shared.fileExists("packages/ui/package.json")) {
    proposals.push(shared.createProposal("wave-03-product", wave, {
      changeType: "design-system",
      targetFile: "packages/ui/",
      description: "Confirm packages/ui tokens drive both landing and apps/web",
      designCraft: 9,
      shipReadiness: 8
    }));
  } else if (shared.fileExists("packages/ui/package.json") && landing) {
    proposals.push(shared.createProposal("wave-03-product", wave, {
      changeType: "design-system",
      targetFile: "landing.html",
      description: "Unify landing.css with packages/ui design tokens (single source of truth)",
      designCraft: 10,
      shipReadiness: 8,
      instructions: ["Extract shared variables; landing and Next app must match typography scale."]
    }));
  }

  if (!player) {
    proposals.push(shared.createProposal("wave-03-product", wave, {
      changeType: "implementation",
      targetFile: "player/",
      description: "Verify showcase player path exists and matches SHIP pre-launch checklist",
      artistImpact: 8,
      shipReadiness: 9,
      sources: ["SHIP-PLAN-7-DAYS.md §4"]
    }));
  }

  proposals.push(shared.createProposal("wave-03-product", wave, {
    changeType: "a11y",
    targetFile: "landing.html",
    description: "Ship-week a11y pass: focus rings, skip link, reduced-motion on player controls",
    artistImpact: 6,
    designCraft: 8,
    securityPrivacy: 6,
    shipReadiness: 9,
    handlerKey: "landing.reduced-motion",
    sources: ["ACCESSIBILITY.md", "SHIP-PLAN-7-DAYS.md Day 5"]
  }));

  return {
    proposals: proposals,
    log: [{ action: "complete", proposals: proposals.length }],
    summary: "Product: " + proposals.length + " proposal(s)."
  };
}

module.exports = { run: run };
