"use strict";

var corp = require("./shared");

function runSupervisor(division, agentOutputs, peerReviews) {
  var proposals = [];
  var failPeers = peerReviews.filter(function (r) { return r.verdict === "FAIL"; }).length;
  var warnPeers = peerReviews.filter(function (r) { return r.verdict === "WARN"; }).length;

  agentOutputs.forEach(function (o) {
    (o.proposals || []).forEach(function (p) {
      if (p.peerFailed) return;
      proposals.push(p);
    });
  });

  var approved = proposals.filter(function (p) {
    return corp.encoreShared.weightedScore(p) >= 5.5;
  });

  var rejected = proposals.length - approved.length;
  var divisionVerdict = "PASS";
  if (failPeers >= 2) divisionVerdict = "FAIL";
  else if (failPeers >= 1 || warnPeers >= 4) divisionVerdict = "WARN";

  return {
    supervisorId: division.id,
    title: division.title,
    verdict: divisionVerdict,
    agentCount: agentOutputs.length,
    proposalCount: proposals.length,
    approvedCount: approved.length,
    rejectedCount: rejected,
    failPeerReviews: failPeers,
    approvedProposals: approved,
    summary: division.id + " " + divisionVerdict + ": " + approved.length + "/" + proposals.length + " approved (" + agentOutputs.length + " agents)"
  };
}

module.exports = { runSupervisor: runSupervisor };
