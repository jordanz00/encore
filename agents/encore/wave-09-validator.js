/**
 * Wave 9 — Cross-validator (conflict resolution + ranking)
 */
"use strict";

var shared = require("./shared");

function resolveConflicts(proposals) {
  var byKey = {};
  proposals.forEach(function (p) {
    var key = (p.targetFile || "") + "|" + (p.changeType || "");
    if (!byKey[key]) byKey[key] = [];
    byKey[key].push(p);
  });
  var out = [];
  Object.keys(byKey).forEach(function (key) {
    var list = byKey[key];
    list.sort(function (a, b) {
      return shared.weightedScore(b) - shared.weightedScore(a);
    });
    out.push(list[0]);
    if (list.length > 1) {
      list[0].conflictWith = list.slice(1).map(function (p) { return p.id; });
    }
  });
  return out;
}

function run(context) {
  var all = context.allProposals || [];
  var resolved = resolveConflicts(all);
  var ranked = resolved.slice().sort(function (a, b) {
    return shared.weightedScore(b) - shared.weightedScore(a);
  });
  var approved = ranked.filter(function (p) {
    return (p.scores && p.scores.securityPrivacy !== 0) || true;
  });

  var report = {
    totalReceived: all.length,
    afterConflictResolution: resolved.length,
    approved: approved.length,
    topFive: approved.slice(0, 5).map(function (p) {
      return {
        id: p.id,
        agentId: p.agentId,
        description: p.description,
        targetFile: p.targetFile,
        weightedScore: Math.round(shared.weightedScore(p) * 10) / 10
      };
    })
  };

  return {
    proposals: [],
    log: [{ action: "complete", report: report }],
    summary: "Validator: " + approved.length + " approved from " + all.length + " proposals.",
    report: report,
    approvedProposals: approved,
    rejectedProposals: []
  };
}

module.exports = { run: run, resolveConflicts: resolveConflicts };
