"use strict";

var fs = require("fs");
var path = require("path");
var shared = require("../shared");

function agentStatus(ctx) {
  var rel = "docs/AGENT-STATUS.md";
  var lines = [
    "# Encore autonomous agent status",
    "",
    "> Auto-maintained by `agents/encore/cycle.js`. Do not hand-edit cycle numbers.",
    "",
    "| Field | Value |",
    "|-------|-------|",
    "| Cycle | " + (ctx.cycle || 0) + " |",
    "| Last run | " + (ctx.timestamp || new Date().toISOString()) + " |",
    "| Applied this cycle | " + (ctx.appliedCount || 0) + " |",
    "| Founder average | " + (ctx.founderAverage != null ? ctx.founderAverage : "n/a") + " |",
    "| Daemon | " + (ctx.daemon ? "on" : "cycle") + " |",
    "",
    "## Active handlers",
    "",
    (ctx.handlers || []).map(function (h) { return "- `" + h + "`"; }).join("\n"),
    "",
    "## Last proposals applied",
    "",
    (ctx.applied || []).slice(0, 15).map(function (a) {
      return "- **" + a.handlerKey + "** → `" + (a.file || a.targetFile || "—") + "`";
    }).join("\n") || "_none_",
    ""
  ];
  var full = path.join(shared.ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, lines.join("\n"), "utf8");
  return { ok: true, changed: true, file: rel };
}

function cycleLog(ctx) {
  var dir = path.join(shared.ROOT, "data", "archive", "encore", "cycles");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  var name = "cycle-" + String(ctx.cycle || 0).padStart(4, "0") + ".json";
  var rel = "data/archive/encore/cycles/" + name;
  fs.writeFileSync(
    path.join(shared.ROOT, rel),
    JSON.stringify(ctx.cyclePayload || {}, null, 2),
    "utf8"
  );
  return { ok: true, changed: true, file: rel };
}

module.exports = { agentStatus: agentStatus, cycleLog: cycleLog };
