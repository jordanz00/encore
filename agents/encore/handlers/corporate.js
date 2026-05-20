"use strict";

var fs = require("fs");
var path = require("path");
var shared = require("../shared");

function corporateStatus(ctx) {
  var rel = "docs/CORPORATE-AGENT-STATUS.md";
  var meta = ctx.corporateMeta || {};
  var divisions = (ctx.corporateDivisions || []).map(function (d) {
    return "| " + d.id + " | " + d.supervisor + " | " + d.agents + " agents | " + d.peerReviews + " peer reviews |";
  }).join("\n");

  var body = [
    "# Encore Corporation — live agent status",
    "",
    "> Auto-updated every daemon cycle. **50 agents → peer ring → 5 SUP → cross-SUP audit → META-0 → CHIEF-0 → auto-build**",
    "",
    "| Field | Value |",
    "|-------|-------|",
    "| Cycle | " + (ctx.cycle || 0) + " |",
    "| Last run | " + (ctx.timestamp || "") + " |",
    "| META-0 verdict | " + (meta.verdict || "—") + " |",
    "| Proposals cleared | " + (meta.totalApproved || 0) + " |",
    "| Files changed this cycle | " + (ctx.appliedCount || 0) + " |",
    "| Cross-SUP audits | " + (ctx.crossReviewCount || 5) + " |",
    "",
    "## Supervisors (10 agents each)",
    "",
    "| Division | Gate | Unit | Peer checks |",
    "|----------|------|------|-------------|",
    divisions || "| — | — | — | — |",
    "",
    "## Org chart",
    "",
    "```",
    "META-0 (Meta-Supervisor)",
    "├── SUP-EXE  Executive      [EXE-01 … EXE-10]",
    "├── SUP-ENG  Engineering   [ENG-01 … ENG-10]",
    "├── SUP-PRD  Product       [PRD-01 … PRD-10]",
    "├── SUP-TRU  Trust         [TRU-01 … TRU-10]",
    "└── SUP-DIS  Discovery     [DIS-01 … DIS-10]",
    "```",
    "",
    "Each cycle: **50 agents → peer ring → supervisor → cross-SUP audit → META-0 → validator → CHIEF-0 → handlers patch repo**",
    ""
  ].join("\n");

  var full = path.join(shared.ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, body, "utf8");
  return { ok: true, changed: true, file: rel };
}

module.exports = { corporateStatus: corporateStatus };
