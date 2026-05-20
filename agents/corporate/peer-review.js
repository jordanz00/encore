"use strict";

var corp = require("./shared");

/**
 * Each agent reviews the next agent in the division (ring).
 * FAIL downgrades proposals; PASS keeps them.
 */
function runPeerReviews(agentOutputs) {
  var reviews = [];
  var n = agentOutputs.length;
  if (n < 2) return { reviews: reviews, outputs: agentOutputs };

  var adjusted = agentOutputs.map(function (o) {
    return {
      agentId: o.agentId,
      proposals: (o.proposals || []).slice(),
      peerVerdict: "PASS"
    };
  });

  for (var i = 0; i < n; i++) {
    var reviewer = agentOutputs[i];
    var target = agentOutputs[(i + 1) % n];
    var verdict = "PASS";
    var note = "Peer OK";

    if ((target.issues || []).length > 0) {
      verdict = "WARN";
      note = "Target reported issues: " + target.issues.join("; ");
    }
    if ((target.proposals || []).length === 0 && (reviewer.proposals || []).length > 0) {
      verdict = "WARN";
      note = "Target produced no proposals; verify coverage";
    }
    if ((target.proposals || []).some(function (p) {
      return !p.targetFile && !p.handlerKey;
    })) {
      verdict = "FAIL";
      note = "Target proposal missing targetFile/handlerKey";
    }

    reviews.push(corp.createReview({
      reviewerId: reviewer.agentId,
      targetId: target.agentId,
      verdict: verdict,
      note: note
    }));

    if (verdict === "FAIL") {
      var adj = adjusted[(i + 1) % n];
      adj.peerVerdict = "FAIL";
      adj.proposals = adj.proposals.map(function (p) {
        p.peerFailed = true;
        if (p.scores) {
          p.scores.shipReadiness = Math.max(0, (p.scores.shipReadiness || 5) - 3);
        }
        return p;
      });
    }
  }

  return { reviews: reviews, outputs: adjusted };
}

module.exports = { runPeerReviews: runPeerReviews };
