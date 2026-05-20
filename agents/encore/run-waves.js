#!/usr/bin/env node
/**
 * Encore Multi-Agent Wave Runner
 * Usage:
 *   node agents/encore/run-waves.js
 *   node agents/encore/run-waves.js --dry-run
 *   node agents/encore/run-waves.js --wave=3
 */
"use strict";

var path = require("path");
var fs = require("fs");

var ENCORE_AGENTS = path.resolve(__dirname);
var ROOT = path.resolve(ENCORE_AGENTS, "../..");
var ARCHIVE_DIR = path.join(ROOT, "data", "archive", "encore");
var AGENTS_LOG_DIR = path.join(ARCHIVE_DIR, "agents");

var WAVE_FILES = [
  "./wave-01-economics.js",
  "./wave-02-competitive.js",
  "./wave-03-product.js",
  "./wave-04-platform.js",
  "./wave-05-catalog-federation.js",
  "./wave-06-security-privacy.js",
  "./wave-07-ship-growth.js",
  "./wave-08-documentation.js",
  "./wave-09-validator.js",
  "./wave-10-founder-auditor.js"
];

function loadConfig() {
  try {
    return require("./encore.config.json");
  } catch (e) {
    return { parallelWaves: true };
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function runAgent(relPath, context) {
  try {
    var agent = require(path.join(ENCORE_AGENTS, relPath.replace("./", "")));
    return agent.run(context);
  } catch (e) {
    return {
      proposals: [],
      log: [{ action: "error", message: e.message }],
      summary: "Error: " + e.message
    };
  }
}

function runProducerWaves(context, waveOrder, parallel) {
  var agentResults = {};
  var allProposals = [];

  function collect(w, result) {
    agentResults["wave" + w] = result;
    if (result && Array.isArray(result.proposals)) {
      result.proposals.forEach(function (p) {
        p.wave = w;
        allProposals.push(p);
      });
    }
  }

  if (parallel) {
    waveOrder.forEach(function (w) {
      context.wave = w;
      var file = WAVE_FILES[w - 1];
      if (!file) return;
      collect(w, runAgent(file, context));
    });
  } else {
    waveOrder.forEach(function (w) {
      context.wave = w;
      var file = WAVE_FILES[w - 1];
      if (!file) return;
      collect(w, runAgent(file, context));
    });
  }

  return { allProposals: allProposals, agentResults: agentResults };
}

/**
 * @param {{ dryRun?: boolean, singleWave?: number|null, parallel?: boolean, quiet?: boolean }} opts
 */
function runWaves(opts) {
  opts = opts || {};
  var dryRun = !!opts.dryRun;
  var singleWave = opts.singleWave != null ? opts.singleWave : null;
  var config = loadConfig();
  var parallel = opts.parallel != null ? opts.parallel : !!config.parallelWaves;
  var quiet = !!opts.quiet;

  var timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  var context = {
    projectRoot: ROOT,
    timestamp: new Date().toISOString()
  };

  if (!dryRun) {
    ensureDir(ARCHIVE_DIR);
    ensureDir(AGENTS_LOG_DIR);
  }

  if (!quiet) {
    console.log("\nEncore Multi-Agent System");
    console.log("=========================\n");
  }

  var waveOrder = singleWave != null ? [singleWave] : [1, 2, 3, 4, 5, 6, 7, 8];
  var produced = runProducerWaves(context, waveOrder, parallel);

  if (!quiet) {
    waveOrder.forEach(function (w) {
      var r = produced.agentResults["wave" + w];
      console.log("Wave " + w + ": " + (r && r.summary ? r.summary : "OK"));
    });
  }

  var validatorResult = null;
  if (singleWave === 9 || singleWave == null) {
    context.wave = 9;
    context.allProposals = produced.allProposals;
    validatorResult = runAgent(WAVE_FILES[8], context);
    produced.agentResults.wave9 = validatorResult;
    if (!quiet) {
      console.log("Wave 9: " + (validatorResult.summary || "OK"));
      if (validatorResult.report) {
        validatorResult.report.topFive.forEach(function (t, i) {
          console.log("  " + (i + 1) + ". [" + t.weightedScore + "] " + t.description);
        });
      }
    }
  }

  var auditorResult = null;
  if (singleWave === 10 || singleWave == null) {
    context.wave = 10;
    context.approvedProposals = (validatorResult && validatorResult.approvedProposals) || [];
    auditorResult = runAgent(WAVE_FILES[9], context);
    produced.agentResults.wave10 = auditorResult;
    if (!quiet) {
      console.log("Wave 10: " + (auditorResult.summary || "OK"));
    }
  }

  var logPath = null;
  var approvedPath = null;

  if (!dryRun) {
    logPath = path.join(AGENTS_LOG_DIR, "run-" + timestamp + ".json");
    fs.writeFileSync(logPath, JSON.stringify({
      product: "encore",
      timestamp: context.timestamp,
      parallel: parallel,
      totalProposals: produced.allProposals.length,
      agentResults: produced.agentResults,
      approvedCount: (validatorResult && validatorResult.report && validatorResult.report.approved) || 0
    }, null, 2), "utf8");

    if (validatorResult && validatorResult.approvedProposals && validatorResult.approvedProposals.length) {
      approvedPath = path.join(ARCHIVE_DIR, "approved-changes-" + timestamp + ".json");
      fs.writeFileSync(approvedPath, JSON.stringify({
        product: "encore",
        timestamp: context.timestamp,
        approved: validatorResult.approvedProposals,
        report: validatorResult.report
      }, null, 2), "utf8");
    }
  }

  return {
    context: context,
    timestamp: timestamp,
    allProposals: produced.allProposals,
    agentResults: produced.agentResults,
    validatorResult: validatorResult,
    auditorResult: auditorResult,
    logPath: logPath,
    approvedPath: approvedPath,
    approvedProposals: (validatorResult && validatorResult.approvedProposals) || []
  };
}

function main() {
  var args = process.argv.slice(2);
  var singleWave = null;
  var dryRun = false;
  args.forEach(function (arg) {
    if (arg === "--dry-run") dryRun = true;
    if (arg.indexOf("--wave=") === 0) singleWave = parseInt(arg.replace("--wave=", ""), 10);
  });
  runWaves({ dryRun: dryRun, singleWave: singleWave });
  console.log("");
}

module.exports = { runWaves: runWaves, ROOT: ROOT, ARCHIVE_DIR: ARCHIVE_DIR };

if (require.main === module) main();
