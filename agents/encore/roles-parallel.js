"use strict";

var fs = require("fs");
var path = require("path");
var shared = require("./shared");

/**
 * Scans docs/roles in parallel batches — emits extra proposals from role briefs.
 */
function scanRole(roleNum) {
  var n = roleNum < 10 ? "0" + roleNum : String(roleNum);
  var rel = "docs/roles/role-" + n + ".md";
  var body = shared.readProjectFile(rel);
  if (!body) return [];
  var proposals = [];
  var title = (body.match(/^# (.+)/m) || [])[1] || "Role " + n;

  if (/stub|TODO|not wired|not implemented/i.test(body)) {
    proposals.push(shared.createProposal("role-" + n, 0, {
      changeType: "implementation",
      targetFile: rel,
      description: title + ": brief mentions stub/TODO — schedule implementation",
      artistImpact: 6,
      shipReadiness: 7,
      handlerKey: null
    }));
  }

  if (/wallet|payout|Stripe/i.test(body) && !shared.grepFile("apps/api/src/routes/payments.ts", /AGENT:wallet-ledger/)) {
    proposals.push(shared.createProposal("role-" + n, 0, {
      changeType: "implementation",
      targetFile: "apps/api/src/routes/payments.ts",
      description: title + ": wire wallet ledger marker in payments route",
      artistImpact: 9,
      economicsTrust: 9,
      handlerKey: "payments.wallet-scaffold"
    }));
  }

  return proposals;
}

function runRolesParallel(config) {
  var batchSize = (config && config.roleBatchSize) || 6;
  var all = [];
  var roleNums = [];
  for (var i = 1; i <= 30; i++) roleNums.push(i);

  for (var start = 0; start < roleNums.length; start += batchSize) {
    var batch = roleNums.slice(start, start + batchSize);
    batch.forEach(function (num) {
      scanRole(num).forEach(function (p) { all.push(p); });
    });
  }

  return { proposals: all, summary: "Roles parallel: " + all.length + " proposal(s) from 30 briefs." };
}

module.exports = { runRolesParallel: runRolesParallel };
