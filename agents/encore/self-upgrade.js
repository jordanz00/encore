"use strict";

var fs = require("fs");
var path = require("path");
var shared = require("./shared");
var stateModule = require("./state");

var MANIFEST = path.join(__dirname, "manifest.json");

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  } catch (e) {
    return { version: 2, upgradesApplied: [] };
  }
}

function saveManifest(m) {
  fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2), "utf8");
}

function ensureDaemonScripts() {
  var pkgPath = path.join(shared.ROOT, "package.json");
  var pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  var scripts = pkg.scripts || {};
  var changed = false;
  if (!scripts["agents:daemon"]) {
    scripts["agents:daemon"] = "node agents/encore/daemon.js";
    changed = true;
  }
  if (!scripts["agents:cycle"]) {
    scripts["agents:cycle"] = "node agents/encore/cycle.js";
    changed = true;
  }
  if (!scripts["agents:stop"]) {
    scripts["agents:stop"] = "node agents/encore/daemon.js --stop";
    changed = true;
  }
  if (changed) {
    pkg.scripts = scripts;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    return { ok: true, changed: true, file: "package.json" };
  }
  return { ok: true, changed: false };
}

function runSelfUpgrade(cycle) {
  var manifest = loadManifest();
  var state = stateModule.loadState();
  var upgrades = [];

  upgrades.push(ensureDaemonScripts());

  if (manifest.version < 3) {
    manifest.version = 3;
    manifest.upgradesApplied.push("v3-corporate-50-agents");
  }

  try {
    var corpUp = require("../corporate/self-upgrade");
    corpUp.runCorporateUpgrade(cycle);
    upgrades.push({ ok: true, note: "corporate_org_upgraded" });
  } catch (e) {}

  if (cycle % 5 === 0 && !manifest.upgradesApplied.includes("cycle-" + cycle + "-audit")) {
    manifest.upgradesApplied.push("cycle-" + cycle + "-audit");
    upgrades.push({ ok: true, note: "periodic_audit_marker" });
  }

  state.agentSystemVersion = manifest.version;
  stateModule.saveState(state);
  saveManifest(manifest);

  return { manifest: manifest, upgrades: upgrades };
}

module.exports = { runSelfUpgrade: runSelfUpgrade };
