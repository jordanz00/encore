/**
 * Wave 1 — Artist economics & schema invariants
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var proposals = [];
  var warnings = [];
  var guarantee = shared.readProjectFile("ARTIST-INCOME-GUARANTEE.md");
  var schema = shared.readProjectFile("packages/db/src/schema.ts");
  var landing = shared.readProjectFile("landing.html");
  var wave = context.wave || 1;

  if (!guarantee) warnings.push("ARTIST-INCOME-GUARANTEE.md missing");
  if (!schema) warnings.push("packages/db/src/schema.ts missing");

  if (schema && !/platform_fee_cents/.test(schema)) {
    warnings.push("sales.platform_fee_cents not found in schema");
  }
  if (schema && schema.indexOf('default(0)') === -1 && /platform_fee_cents/.test(schema)) {
    warnings.push("Verify platform_fee_cents defaults to 0");
  }
  if (schema && !/wallet_ledger/.test(schema)) {
    warnings.push("wallet_ledger table missing");
  }
  if (schema && !/discovery_dividend/.test(schema)) {
    warnings.push("discovery_dividend tables missing");
  }

  if (landing) {
    if (/\+?\$0\.024/.test(landing) && !/demo|sandbox|illustrat/i.test(landing)) {
      proposals.push(shared.createProposal("wave-01-economics", wave, {
        changeType: "copy",
        targetFile: "landing.html",
        description: "Label demo per-play credit as sandbox/illustrative — avoid implying live pool rate",
        artistImpact: 8,
        economicsTrust: 9,
        designCraft: 6,
        shipReadiness: 8,
        handlerKey: "landing.demo-sandbox-note",
        sources: ["ARTIST-INCOME-GUARANTEE.md"],
        instructions: [
          "Add visible line: demo wallet credit ≠ live Discovery Dividend rate until transparency report ships.",
          "Link to future encore.audio/transparency stub."
        ]
      }));
    }
    if (/0%\s*platform fee/i.test(landing) && !/ARTIST-INCOME|ARTIST-ECONOMICS/i.test(landing)) {
      proposals.push(shared.createProposal("wave-01-economics", wave, {
        changeType: "copy",
        targetFile: "landing.html",
        description: "Link 0% platform fee claim to ARTIST-INCOME-GUARANTEE.md on landing",
        artistImpact: 7,
        economicsTrust: 8,
        shipReadiness: 7,
        handlerKey: "landing.guarantee-link",
        sources: ["ARTIST-INCOME-GUARANTEE.md"],
        instructions: ["Add footer or economics section link to guarantee doc in repo/Pages."]
      }));
    }
  }

  if (warnings.length) {
    proposals.push(shared.createProposal("wave-01-economics", wave, {
      changeType: "validation",
      targetFile: "packages/db/src/schema.ts",
      description: "Resolve economics schema warnings: " + warnings.join("; "),
      artistImpact: 9,
      economicsTrust: 9,
      shipReadiness: 7,
      instructions: warnings.map(function (w) { return "Fix: " + w; })
    }));
  }

  var stripeStub = shared.grepFile("apps/api/src/routes/payments.ts", /stub|TODO|stripe/i) ||
    shared.fileExists("apps/api/src/routes/payments.ts");
  if (stripeStub) {
    proposals.push(shared.createProposal("wave-01-economics", wave, {
      changeType: "implementation",
      targetFile: "apps/api/src/routes/payments.ts",
      description: "Wire Stripe Connect + wallet ledger per ROADMAP v0.3 (payments still stub)",
      artistImpact: 10,
      economicsTrust: 10,
      shipReadiness: 6,
      handlerKey: "payments.wallet-scaffold",
      sources: ["ROADMAP.md", "docs/rfcs/006-payments-payouts.md"],
      instructions: ["Implement webhook → wallet_ledger credit per ARTIST-INCOME-GUARANTEE §wallet."]
    }));
  }

  return {
    proposals: proposals,
    log: [{ action: "complete", warnings: warnings.length, proposals: proposals.length }],
    summary: "Economics: " + warnings.length + " warning(s), " + proposals.length + " proposal(s)."
  };
}

module.exports = { run: run };
