/**
 * Encore multi-agent shared helpers.
 * Standalone — not linked to any other project.
 */
"use strict";

var path = require("path");
var fs = require("fs");

var ROOT = path.resolve(__dirname, "../..");

var SCORE_WEIGHTS = {
  artistImpact: 0.30,
  economicsTrust: 0.25,
  designCraft: 0.20,
  securityPrivacy: 0.15,
  shipReadiness: 0.10
};

function num(v, d) {
  return Math.min(10, Math.max(0, v != null ? v : d));
}

function createProposal(agentId, wave, opts) {
  return {
    agentId: agentId,
    wave: wave,
    id: opts.id || agentId + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    changeType: opts.changeType || "suggestion",
    targetFile: opts.targetFile || null,
    description: opts.description || "",
    impactScore: Math.min(10, Math.max(0, opts.impactScore != null ? opts.impactScore : 5)),
    scores: {
      artistImpact: num(opts.artistImpact, 5),
      economicsTrust: num(opts.economicsTrust, 5),
      designCraft: num(opts.designCraft, 5),
      securityPrivacy: num(opts.securityPrivacy, 5),
      shipReadiness: num(opts.shipReadiness, 5)
    },
    conflictWith: opts.conflictWith || [],
    instructions: opts.instructions || [],
    sources: opts.sources || [],
    handlerKey: opts.handlerKey || null,
    timestamp: new Date().toISOString()
  };
}

function readProjectFile(relPath) {
  try {
    return fs.readFileSync(path.join(ROOT, relPath), "utf8");
  } catch (e) {
    return null;
  }
}

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function weightedScore(proposal) {
  var s = proposal.scores || {};
  return (
    num(s.artistImpact, 5) * SCORE_WEIGHTS.artistImpact +
    num(s.economicsTrust, 5) * SCORE_WEIGHTS.economicsTrust +
    num(s.designCraft, 5) * SCORE_WEIGHTS.designCraft +
    num(s.securityPrivacy, 5) * SCORE_WEIGHTS.securityPrivacy +
    num(s.shipReadiness, 5) * SCORE_WEIGHTS.shipReadiness
  );
}

function grepFile(relPath, pattern) {
  var body = readProjectFile(relPath);
  if (!body) return false;
  return pattern.test(body);
}

module.exports = {
  ROOT: ROOT,
  SCORE_WEIGHTS: SCORE_WEIGHTS,
  createProposal: createProposal,
  readProjectFile: readProjectFile,
  fileExists: fileExists,
  weightedScore: weightedScore,
  grepFile: grepFile
};
