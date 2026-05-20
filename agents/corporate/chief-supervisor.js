"use strict";

var shared = require("../encore/shared");

/**
 * CHIEF-0 — final gate before files are written.
 */
function runChief(proposals) {
  var approved = [];
  var rejected = [];

  proposals.forEach(function (p) {
    var reason = null;
    if (p.peerFailed) reason = "peer_failed";
    if (p.metaApproved === false) reason = "meta_rejected";
    if (/token|creator coin/i.test(p.description || "") && !/no token|anti-token/i.test(p.description || "")) {
      reason = "token_policy";
    }
    if (p.handlerKey && p.handlerKey.indexOf("landing.") === 0) {
      /* allow */
    } else if (!p.handlerKey && !p.targetFile) {
      reason = "no_actionable_target";
    }
    if (reason) {
      rejected.push({ id: p.id, reason: reason });
      return;
    }
    if (shared.weightedScore(p) < 5) {
      rejected.push({ id: p.id, reason: "low_score" });
      return;
    }
    p.chiefApproved = true;
    approved.push(p);
  });

  return {
    chiefId: "CHIEF-0",
    verdict: rejected.length > approved.length ? "WARN" : "PASS",
    approved: approved.length,
    rejected: rejected.length,
    approvedProposals: approved,
    summary: "CHIEF-0 " + (rejected.length ? "WARN" : "PASS") + ": " + approved.length + " cleared to build"
  };
}

module.exports = { runChief: runChief };
