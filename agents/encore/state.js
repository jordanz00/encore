"use strict";

var fs = require("fs");
var path = require("path");
var shared = require("./shared");

var STATE_PATH = path.join(shared.ROOT, "data", "archive", "encore", "state.json");

var DEFAULT_STATE = {
  cycle: 0,
  appliedFingerprints: [],
  daemonStartedAt: null,
  lastCycleAt: null,
  agentSystemVersion: 3,
  lastAppliedCount: 0,
  lastCorpMeta: null,
  corporationAgents: 50,
  corporationSupervisors: 5
};

function loadState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      return Object.assign({}, DEFAULT_STATE, JSON.parse(fs.readFileSync(STATE_PATH, "utf8")));
    }
  } catch (e) {}
  return Object.assign({}, DEFAULT_STATE);
}

function saveState(state) {
  var dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

module.exports = {
  STATE_PATH: STATE_PATH,
  loadState: loadState,
  saveState: saveState,
  DEFAULT_STATE: DEFAULT_STATE
};
