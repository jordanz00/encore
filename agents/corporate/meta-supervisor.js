"use strict";

var corp = require("./shared");

function runMeta(supervisorReports) {
  var all = [];
  var fails = 0;
  var warns = 0;

  supervisorReports.forEach(function (r) {
    if (r.verdict === "FAIL") fails++;
    if (r.verdict === "WARN") warns++;
    (r.approvedProposals || []).forEach(function (p) {
      p.metaApproved = r.verdict !== "FAIL";
      all.push(p);
    });
  });

  var verdict = "PASS";
  if (fails >= 2) verdict = "REJECTED";
  else if (fails >= 1 || warns >= 3) verdict = "NEEDS_REVISION";

  var approved = all.filter(function (p) {
    return p.metaApproved !== false && !p.peerFailed;
  });

  return {
    metaId: "META-0",
    verdict: verdict,
    supervisorFails: fails,
    supervisorWarns: warns,
    totalApproved: approved.length,
    approvedProposals: approved,
    digest: supervisorReports.map(function (r) {
      return { id: r.supervisorId, verdict: r.verdict, approved: r.approvedCount };
    }),
    summary: "META-0 " + verdict + ": " + approved.length + " proposals cleared from " + supervisorReports.length + " supervisors"
  };
}

module.exports = { runMeta: runMeta };
