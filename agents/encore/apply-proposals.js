"use strict";

var shared = require("./shared");
var handlers = require("./handlers");
var proposalKey = require("./proposal-key");
var stateModule = require("./state");

function loadConfig() {
  try {
    return require("./encore.config.json");
  } catch (e) {
    return { maxApplyPerCycle: 10, minScoreToApply: 6, autoApply: true };
  }
}

function pickApplicable(proposals, state, config) {
  var min = config.minScoreToApply != null ? config.minScoreToApply : 6;
  var max = config.maxApplyPerCycle != null ? config.maxApplyPerCycle : 10;
  var applied = state.appliedFingerprints || [];
  var sorted = proposals.slice().sort(function (a, b) {
    return shared.weightedScore(b) - shared.weightedScore(a);
  });
  var out = [];
  for (var i = 0; i < sorted.length && out.length < max; i++) {
    var p = sorted[i];
    if (!p.handlerKey) continue;
    if (shared.weightedScore(p) < min) continue;
    var fp = proposalKey.fingerprint(p);
    if (applied.indexOf(fp) !== -1) continue;
    out.push({ proposal: p, fingerprint: fp });
  }
  return out;
}

function applyCycle(approvedProposals, ctx) {
  var config = loadConfig();
  if (!config.autoApply) {
    return { applied: [], skipped: approvedProposals.length, reason: "autoApply_disabled" };
  }

  var state = stateModule.loadState();
  var picks = pickApplicable(approvedProposals, state, config);
  var results = [];

  picks.forEach(function (pick) {
    var p = pick.proposal;
    var res = handlers.apply(p.handlerKey, Object.assign({}, ctx, { proposal: p }));
    res.handlerKey = p.handlerKey;
    res.targetFile = p.targetFile;
    res.fingerprint = pick.fingerprint;
    if (res.ok && res.changed === true) {
      if (state.appliedFingerprints.indexOf(pick.fingerprint) === -1) {
        state.appliedFingerprints.push(pick.fingerprint);
      }
    }
    results.push(res);
  });

  handlers.apply("docs.agent-status", Object.assign({}, ctx, {
    applied: results.filter(function (r) { return r.changed; }),
    handlers: handlers.listHandlers(),
    appliedCount: results.filter(function (r) { return r.changed; }).length
  }));

  state.lastAppliedCount = results.filter(function (r) { return r.ok && r.changed; }).length;
  stateModule.saveState(state);

  return {
    applied: results,
    changedCount: state.lastAppliedCount
  };
}

module.exports = { applyCycle: applyCycle, pickApplicable: pickApplicable };
