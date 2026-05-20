"use strict";

var fs = require("fs");
var path = require("path");
var shared = require("./shared");

function runResearch(ctx) {
  var dir = path.join(shared.ROOT, "agents", "research", "live");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  var stamp = ctx.timestamp || new Date().toISOString();
  var lines = [
    "# Encore live research — cycle " + (ctx.cycle || 0),
    "",
    "Generated: " + stamp,
    "",
    "## Repo signals",
    ""
  ];

  var checkFiles = [
    "landing.html",
    "SHIP-PLAN-7-DAYS.md",
    "ROADMAP.md",
    "ARTIST-INCOME-GUARANTEE.md",
    "apps/api/src/routes/payments.ts",
    "packages/db/src/schema.ts"
  ];

  checkFiles.forEach(function (rel) {
    var full = path.join(shared.ROOT, rel);
    if (!fs.existsSync(full)) {
      lines.push("- `" + rel + "`: **missing**");
      return;
    }
    var stat = fs.statSync(full);
    lines.push("- `" + rel + "`: " + stat.size + " bytes, mtime " + stat.mtime.toISOString());
  });

  lines.push("", "## Top approved proposals this cycle", "");
  (ctx.topProposals || []).slice(0, 8).forEach(function (p, i) {
    lines.push((i + 1) + ". [" + shared.weightedScore(p).toFixed(1) + "] " + p.description);
  });

  lines.push("", "## Applied changes", "");
  (ctx.applied || []).forEach(function (a) {
    if (a.changed) lines.push("- `" + a.handlerKey + "` → " + (a.file || "—"));
  });
  if (!(ctx.applied || []).some(function (a) { return a.changed; })) {
    lines.push("_No file changes this cycle._");
  }

  lines.push("", "## Next research actions", "");
  lines.push("- Re-read `COMPETITORS.md` after major platform news");
  lines.push("- Verify Stripe Connect KYB status before live wallet copy");
  lines.push("- Cornerstone artist count vs SHIP day 3 gate");
  lines.push("");

  var latest = path.join(dir, "latest-cycle.md");
  fs.writeFileSync(latest, lines.join("\n"), "utf8");

  var hist = path.join(dir, "cycle-" + String(ctx.cycle || 0).padStart(4, "0") + ".md");
  fs.writeFileSync(hist, lines.join("\n"), "utf8");

  return { ok: true, file: "agents/research/live/latest-cycle.md" };
}

module.exports = { runResearch: runResearch };
