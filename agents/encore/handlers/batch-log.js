"use strict";

var fs = require("fs");
var path = require("path");
var shared = require("../shared");

function appendBatchLine(ctx) {
  var rel = "docs/BATCH-CYCLE-LOG.md";
  var full = path.join(shared.ROOT, rel);
  var line =
    "- Cycle " + (ctx.cycle || "?") + " @ " + (ctx.timestamp || new Date().toISOString()) +
    " — applied " + (ctx.appliedCount || 0) + ", META " + (ctx.metaVerdict || "—") + "\n";
  var body = "";
  if (fs.existsSync(full)) body = fs.readFileSync(full, "utf8");
  else body = "# Encore batch cycle log\n\n";
  if (body.indexOf(line.trim()) !== -1) return { ok: true, changed: false, file: rel };
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, body + line, "utf8");
  return { ok: true, changed: true, file: rel };
}

module.exports = { appendBatchLine: appendBatchLine };
