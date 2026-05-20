"use strict";

/**
 * Supervisors audit each other (ring). Downgrades division verdict on FAIL.
 */
function runCrossSupervisorPeer(divisionResults) {
  var n = divisionResults.length;
  var reviews = [];
  if (n < 2) return { reviews: reviews, reports: divisionResults.map(function (d) { return d.supervisor; }) };

  var reports = divisionResults.map(function (d) {
    return Object.assign({}, d.supervisor, { crossPeerVerdict: "PASS" });
  });

  for (var i = 0; i < n; i++) {
    var reviewerDiv = divisionResults[i];
    var targetDiv = divisionResults[(i + 1) % n];
    var target = targetDiv.supervisor;
    var verdict = "PASS";
    var note = reviewerDiv.division + " audited " + targetDiv.division;

    if (target.verdict === "FAIL") {
      verdict = "WARN";
      note = "Target division already FAIL";
    }
    if (target.approvedCount === 0 && target.proposalCount > 0) {
      verdict = "FAIL";
      note = "Supervisor approved zero proposals";
    }
    if (target.failPeerReviews >= 3) {
      verdict = "WARN";
      note = "High internal peer failures";
    }

    reviews.push({
      reviewerSupervisor: reviewerDiv.division,
      targetSupervisor: targetDiv.division,
      verdict: verdict,
      note: note,
      at: new Date().toISOString()
    });

    if (verdict === "FAIL") {
      reports[(i + 1) % n].crossPeerVerdict = "FAIL";
      if (reports[(i + 1) % n].verdict === "PASS") reports[(i + 1) % n].verdict = "WARN";
    }
  }

  return { reviews: reviews, reports: reports };
}

module.exports = { runCrossSupervisorPeer: runCrossSupervisorPeer };
