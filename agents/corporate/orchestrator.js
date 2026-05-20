"use strict";

var fs = require("fs");
var path = require("path");
var agentUnit = require("./agent-unit");
var peerReview = require("./peer-review");
var supervisorGate = require("./supervisor-gate");
var crossSupervisorPeer = require("./cross-supervisor-peer");
var metaSupervisor = require("./meta-supervisor");
var corp = require("./shared");

var ORG = require("./org.json");
var ARCHIVE = path.join(corp.ROOT, "data", "archive", "encore", "corporate");

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

/** 10 agents under one supervisor — run together */
function runDivision(division, quiet) {
  var outputs = division.agents.map(function (agent) {
    return agentUnit.runAgent(agent, division);
  });

  var peer = peerReview.runPeerReviews(outputs);
  var sup = supervisorGate.runSupervisor(division, peer.outputs, peer.reviews);

  if (!quiet) {
    console.log("  " + sup.summary + " | peer checks: " + peer.reviews.length);
  }

  return {
    division: division.id,
    agentOutputs: outputs,
    peerReviews: peer.reviews,
    supervisor: sup
  };
}

function runCorporateCycle(ctx) {
  ctx = ctx || {};
  var quiet = !!ctx.quiet;
  var cycle = ctx.cycle || 0;

  if (!quiet) {
    console.log("\n── Corporation: " + ORG.supervisors.length + " supervisors × 10 agents = 50 ──\n");
  }

  var divisionResults = ORG.supervisors.map(function (div) {
    return runDivision(div, quiet);
  });

  var cross = crossSupervisorPeer.runCrossSupervisorPeer(divisionResults);
  if (!quiet) {
    cross.reviews.forEach(function (r) {
      console.log("  Cross-audit " + r.reviewerSupervisor + "→" + r.targetSupervisor + ": " + r.verdict);
    });
  }

  divisionResults.forEach(function (d, i) {
    d.supervisor = cross.reports[i];
  });

  var meta = metaSupervisor.runMeta(cross.reports);
  if (!quiet) {
    console.log("  " + meta.summary + "\n");
  }

  var payload = {
    cycle: cycle,
    timestamp: new Date().toISOString(),
    meta: meta,
    crossSupervisorReviews: cross.reviews,
    divisions: divisionResults.map(function (d) {
      return {
        id: d.division,
        supervisor: d.supervisor.verdict,
        crossPeer: d.supervisor.crossPeerVerdict,
        peerReviews: d.peerReviews.length,
        agents: d.agentOutputs.length
      };
    })
  };

  ensureDir(ARCHIVE);
  fs.writeFileSync(
    path.join(ARCHIVE, "cycle-" + String(cycle).padStart(4, "0") + ".json"),
    JSON.stringify(payload, null, 2),
    "utf8"
  );
  fs.writeFileSync(path.join(ARCHIVE, "latest.json"), JSON.stringify(payload, null, 2), "utf8");

  return {
    proposals: meta.approvedProposals,
    meta: meta,
    crossReviews: cross.reviews,
    divisionResults: divisionResults,
    agentCount: ORG.supervisors.length * 10,
    supervisorCount: ORG.supervisors.length
  };
}

module.exports = { runCorporateCycle: runCorporateCycle, ORG: ORG };
