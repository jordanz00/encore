#!/usr/bin/env node
/**
 * Run N corporation cycles back-to-back and apply all handler upgrades.
 * Usage: node agents/encore/batch-cycles.js [count]
 */
"use strict";

var fs = require("fs");
var path = require("path");
var cycle = require("./cycle");
var applyProposals = require("./apply-proposals");
var handlers = require("./handlers");
var stateModule = require("./state");
var shared = require("./shared");
var chiefSupervisor = require("../corporate/chief-supervisor");
var validator = require("./wave-09-validator");
var corporate = require("../corporate/orchestrator");

var ROOT = shared.ROOT;
var ARCHIVE = path.join(ROOT, "data", "archive", "encore");

function uniqueByHandler(proposals) {
  var map = {};
  proposals.forEach(function (p) {
    if (!p.handlerKey) return;
    var prev = map[p.handlerKey];
    if (!prev || shared.weightedScore(p) > shared.weightedScore(prev)) {
      map[p.handlerKey] = p;
    }
  });
  return Object.keys(map).map(function (k) { return map[k]; });
}

function applyAllHandlers(ctx) {
  var keys = handlers.listHandlers();
  var results = [];
  keys.forEach(function (key) {
    if (key.indexOf("docs.") === 0) {
      results.push(handlers.apply(key, ctx));
      return;
    }
    var res = handlers.apply(key, Object.assign({}, ctx, {
      proposal: { handlerKey: key, targetFile: null, description: "batch apply-all " + key }
    }));
    res.handlerKey = key;
    results.push(res);
  });
  return results;
}

function main() {
  var count = parseInt(process.argv[2] || "150", 10);
  if (!count || count < 1) count = 150;

  console.log("\nEncore batch: " + count + " corporation cycles\n");

  var startCycle = stateModule.loadState().cycle || 0;
  var allApproved = [];
  var totalChanged = 0;
  var t0 = Date.now();

  for (var i = 0; i < count; i++) {
    var r = cycle.runCycle({ quiet: true });
    (r.validatorResult && r.validatorResult.approvedProposals || []).forEach(function (p) {
      allApproved.push(p);
    });
    totalChanged += (r.applyResult && r.applyResult.changedCount) || 0;
    if ((i + 1) % 25 === 0 || i === count - 1) {
      console.log("  " + (i + 1) + "/" + count + " cycles — cumulative file changes: " + totalChanged);
    }
  }

  var unique = uniqueByHandler(allApproved);
  console.log("\nFinal apply-all: " + unique.length + " unique handlers from " + allApproved.length + " proposals");

  var state = stateModule.loadState();
  state.appliedFingerprints = [];
  stateModule.saveState(state);

  var finalApply = applyProposals.applyCycle(unique, {
    cycle: state.cycle,
    timestamp: new Date().toISOString(),
    batch: true
  });
  totalChanged += finalApply.changedCount || 0;

  var sweep = applyAllHandlers({
    cycle: state.cycle,
    timestamp: new Date().toISOString(),
    batch: true
  });
  var sweepChanged = sweep.filter(function (r) { return r.changed; }).length;
  totalChanged += sweepChanged;

  cycle.runCycle({ quiet: false });

  var summary = {
    batchCount: count,
    startCycle: startCycle,
    endCycle: stateModule.loadState().cycle,
    uniqueHandlers: unique.length,
    totalProposalsSeen: allApproved.length,
    totalFilesChanged: totalChanged,
    sweepChanged: sweepChanged,
    elapsedMs: Date.now() - t0,
    completedAt: new Date().toISOString()
  };

  fs.mkdirSync(ARCHIVE, { recursive: true });
  fs.writeFileSync(
    path.join(ARCHIVE, "batch-150-summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8"
  );

  console.log("\nBatch complete.");
  console.log("  Cycles: " + startCycle + " → " + summary.endCycle);
  console.log("  Files touched (approx): " + totalChanged);
  console.log("  Summary: data/archive/encore/batch-150-summary.json\n");
}

main();
