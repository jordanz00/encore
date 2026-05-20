#!/usr/bin/env node
/**
 * Autonomous corporation cycle:
 * 50 agents → peer review → 5 supervisors → META-0 → validate → apply → research → upgrade
 */
"use strict";

var runWaves = require("./run-waves");
var applyProposals = require("./apply-proposals");
var researchLoop = require("./research-loop");
var selfUpgrade = require("./self-upgrade");
var stateModule = require("./state");
var handlers = require("./handlers");
var corporate = require("../corporate/orchestrator");
var chiefSupervisor = require("../corporate/chief-supervisor");
var validator = require("./wave-09-validator");
var founder = require("./wave-10-founder-auditor");

function loadConfig() {
  return require("./encore.config.json");
}

function runCycle(opts) {
  opts = opts || {};
  var config = loadConfig();
  var state = stateModule.loadState();
  state.cycle = (state.cycle || 0) + 1;
  var cycleNum = state.cycle;
  var cycle = cycleNum;
  var quiet = !!opts.quiet;
  var ts = new Date().toISOString();

  if (!quiet) {
    console.log("\n═══ Encore Corporation — cycle #" + cycle + " ═══\n");
  }

  selfUpgrade.runSelfUpgrade(cycle);

  var corpResult = corporate.runCorporateCycle({ cycle: cycle, quiet: quiet });
  var allProposals = corpResult.proposals.slice();

  if (config.runLegacyWaves) {
    var waveResult = runWaves.runWaves({ quiet: true, parallel: config.parallelWaves });
    allProposals = allProposals.concat(waveResult.allProposals);
  }

  var validatorResult = validator.run({ allProposals: allProposals, wave: 9 });
  if (!quiet) {
    console.log("Cross-validator: " + validatorResult.summary);
  }

  var chiefResult = chiefSupervisor.runChief(validatorResult.approvedProposals || []);
  if (!quiet) {
    console.log(chiefResult.summary);
  }

  var approved = chiefResult.approvedProposals || [];
  var applyResult = { applied: [], changedCount: 0 };

  if (config.autoApply) {
    applyResult = applyProposals.applyCycle(approved, {
      cycle: cycle,
      timestamp: ts,
      daemon: !!opts.daemon
    });
    if (!quiet) {
      console.log("Build/apply: " + applyResult.changedCount + " file(s) modified");
    }
  }

  handlers.apply("docs.corporate-status", {
    cycle: cycle,
    timestamp: ts,
    crossReviewCount: (corpResult.crossReviews || []).length,
    corporateMeta: corpResult.meta,
    corporateDivisions: corpResult.divisionResults.map(function (d) {
      return {
        id: d.division,
        supervisor: d.supervisor.verdict,
        agents: d.agentOutputs.length,
        peerReviews: d.peerReviews.length
      };
    }),
    appliedCount: applyResult.changedCount
  });

  var auditorResult = founder.run({
    approvedProposals: approved,
    wave: 10
  });
  if (!quiet) {
    console.log("CEO auditor: " + (auditorResult.summary || ""));
  }

  if (config.researchEachCycle) {
    researchLoop.runResearch({
      cycle: cycle,
      timestamp: ts,
      topProposals: approved,
      applied: applyResult.applied
    });
  }

  handlers.apply("docs.batch-cycle-log", {
    cycle: cycle,
    timestamp: ts,
    appliedCount: applyResult.changedCount,
    metaVerdict: corpResult.meta.verdict
  });

  handlers.apply("docs.cycle-log", {
    cycle: cycle,
    cyclePayload: {
      cycle: cycle,
      timestamp: ts,
      corporation: {
        agents: corpResult.agentCount,
        supervisors: corpResult.supervisorCount,
        metaVerdict: corpResult.meta.verdict
      },
      proposals: allProposals.length,
      approved: approved.length,
      applied: applyResult.changedCount,
      founderAverage: auditorResult.founderAverage
    }
  });

  state.lastCycleAt = ts;
  state.lastCorpMeta = corpResult.meta.verdict;
  state.lastAppliedCount = applyResult.changedCount;
  state.corporationAgents = corpResult.agentCount;
  state.corporationSupervisors = corpResult.supervisorCount;
  stateModule.saveState(state);

  if (!quiet) {
    console.log("\nCorporation cycle #" + cycle + " complete.\n");
  }

  return {
    cycle: cycle,
    corporate: corpResult,
    validatorResult: validatorResult,
    applyResult: applyResult,
    auditorResult: auditorResult,
    proposalCount: allProposals.length,
    approvedCount: approved.length
  };
}

function main() {
  runCycle({ quiet: false });
}

module.exports = { runCycle: runCycle };

if (require.main === module) main();
