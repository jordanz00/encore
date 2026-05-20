#!/usr/bin/env node
/**
 * Always-on Encore agent daemon.
 *   node agents/encore/daemon.js          # start
 *   node agents/encore/daemon.js --stop   # stop via pid file
 *   node agents/encore/daemon.js --once   # one cycle then exit
 */
"use strict";

var fs = require("fs");
var path = require("path");
var cycle = require("./cycle");
var stateModule = require("./state");
var shared = require("./shared");

var PID_FILE = path.join(shared.ROOT, "data", "archive", "encore", "daemon.pid");
var config = require("./encore.config.json");

function writePid() {
  fs.mkdirSync(path.dirname(PID_FILE), { recursive: true });
  fs.writeFileSync(PID_FILE, String(process.pid), "utf8");
}

function removePid() {
  try {
    fs.unlinkSync(PID_FILE);
  } catch (e) {}
}

function stopDaemon() {
  if (!fs.existsSync(PID_FILE)) {
    console.log("No daemon pid file.");
    return;
  }
  var pid = parseInt(fs.readFileSync(PID_FILE, "utf8"), 10);
  try {
    process.kill(pid, "SIGTERM");
    console.log("Stopped daemon pid " + pid);
  } catch (e) {
    console.log("Daemon not running (" + e.message + "). Cleaning pid file.");
  }
  removePid();
}

function main() {
  var args = process.argv.slice(2);
  if (args.indexOf("--stop") !== -1) {
    stopDaemon();
    return;
  }

  if (args.indexOf("--once") !== -1) {
    cycle.runCycle({ quiet: false });
    return;
  }

  if (fs.existsSync(PID_FILE)) {
    var old = parseInt(fs.readFileSync(PID_FILE, "utf8"), 10);
    try {
      process.kill(old, 0);
      console.error("Daemon already running (pid " + old + "). Use --stop first.");
      process.exit(1);
    } catch (e) {
      removePid();
    }
  }

  var state = stateModule.loadState();
  state.daemonStartedAt = new Date().toISOString();
  stateModule.saveState(state);

  writePid();
  var intervalMs = config.intervalMs || 300000;

  console.log("Encore agent daemon started (pid " + process.pid + ")");
  console.log("Cycle every " + (intervalMs / 1000) + "s — Ctrl+C to stop\n");

  function tick() {
    try {
      cycle.runCycle({ quiet: false, daemon: true });
    } catch (e) {
      console.error("Cycle error:", e.message);
    }
  }

  tick();
  var timer = setInterval(tick, intervalMs);

  function shutdown() {
    clearInterval(timer);
    removePid();
    console.log("\nDaemon stopped.");
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
