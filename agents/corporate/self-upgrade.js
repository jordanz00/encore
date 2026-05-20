"use strict";

var fs = require("fs");
var path = require("path");
var corp = require("./shared");

var ORG_PATH = path.join(__dirname, "org.json");
var MANIFEST_PATH = path.join(__dirname, "manifest.json");

function loadOrg() {
  return JSON.parse(fs.readFileSync(ORG_PATH, "utf8"));
}

function saveOrg(org) {
  org.lastCycleUpgrade = new Date().toISOString();
  org.version = (org.version || 1) + 0.01;
  fs.writeFileSync(ORG_PATH, JSON.stringify(org, null, 2) + "\n", "utf8");
}

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  } catch (e) {
    return { version: 1, cycles: [] };
  }
}

function saveManifest(m) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2), "utf8");
}

function runCorporateUpgrade(cycle) {
  var org = loadOrg();
  var manifest = loadManifest();
  var notes = [];

  manifest.cycles = manifest.cycles || [];
  manifest.cycles.push({ cycle: cycle, at: new Date().toISOString() });
  if (manifest.cycles.length > 100) manifest.cycles = manifest.cycles.slice(-100);

  org.cycle = cycle;
  saveOrg(org);
  manifest.version = (manifest.version || 1) + 1;
  manifest.lastUpgrade = new Date().toISOString();
  saveManifest(manifest);

  notes.push("org.json version " + org.version.toFixed(2));

  return { org: org, manifest: manifest, notes: notes };
}

module.exports = { runCorporateUpgrade: runCorporateUpgrade };
