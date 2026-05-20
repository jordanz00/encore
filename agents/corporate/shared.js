"use strict";

var path = require("path");
var encoreShared = require("../encore/shared");

var ROOT = encoreShared.ROOT;

function createCorpProposal(agent, supervisorId, opts) {
  var p = encoreShared.createProposal(agent.id, 0, {
    changeType: opts.changeType || "corp",
    targetFile: opts.targetFile || (agent.files && agent.files[0]) || null,
    description: opts.description || agent.name + ": " + (opts.issue || "check"),
    artistImpact: opts.artistImpact != null ? opts.artistImpact : 6,
    economicsTrust: opts.economicsTrust != null ? opts.economicsTrust : 6,
    designCraft: opts.designCraft != null ? opts.designCraft : 5,
    securityPrivacy: opts.securityPrivacy != null ? opts.securityPrivacy : 6,
    shipReadiness: opts.shipReadiness != null ? opts.shipReadiness : 7,
    handlerKey: opts.handlerKey || agent.handler || null,
    instructions: opts.instructions || []
  });
  p.supervisorId = supervisorId;
  p.agentName = agent.name;
  p.division = opts.division;
  return p;
}

function createReview(opts) {
  return {
    reviewerId: opts.reviewerId,
    targetId: opts.targetId,
    verdict: opts.verdict,
    note: opts.note || "",
    at: new Date().toISOString()
  };
}

module.exports = {
  ROOT: ROOT,
  encoreShared: encoreShared,
  createCorpProposal: createCorpProposal,
  createReview: createReview
};
