"use strict";

var fs = require("fs");
var path = require("path");
var shared = require("../shared");

function writeNew(rel, content) {
  var full = path.join(shared.ROOT, rel);
  if (fs.existsSync(full)) return { ok: true, changed: false, file: rel };
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  return { ok: true, changed: true, file: rel };
}

function waitlistRoute() {
  return writeNew(
    "apps/api/src/routes/waitlist.ts",
    [
      "/**",
      " * Waitlist — POST email for launch audience (ship week).",
      " * Auto-scaffolded by Encore agent system.",
      " */",
      "import type { FastifyInstance } from \"fastify\";",
      "",
      "export async function registerWaitlist(app: FastifyInstance) {",
      "  app.post(\"/waitlist\", async (req, reply) => {",
      "    const body = req.body as { email?: string };",
      "    if (!body?.email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(body.email)) {",
      "      return reply.status(400).send({ error: \"valid email required\" });",
      "    }",
      "    // TODO: persist to waitlist table via @encore/db",
      "    return reply.send({ ok: true });",
      "  });",
      "}",
      ""
    ].join("\n")
  );
}

function transparencyPage() {
  return writeNew(
    "transparency/index.html",
    [
      "<!DOCTYPE html>",
      "<html lang=\"en\">",
      "<head>",
      "  <meta charset=\"UTF-8\" />",
      "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />",
      "  <title>Encore — Transparency</title>",
      "  <style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;line-height:1.5}</style>",
      "</head>",
      "<body>",
      "  <h1>Encore transparency</h1>",
      "  <p>Quarterly pool disbursements and Discovery Dividend rates will publish here (ROADMAP v0.4).</p>",
      "  <p><a href=\"../landing.html\">← Back to Encore</a></p>",
      "</body>",
      "</html>",
      ""
    ].join("\n")
  );
}

function pressKit() {
  return writeNew(
    "press/index.html",
    [
      "<!DOCTYPE html>",
      "<html lang=\"en\">",
      "<head><meta charset=\"UTF-8\" /><title>Encore Press Kit</title></head>",
      "<body style=\"font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem\">",
      "  <h1>Encore press kit</h1>",
      "  <p>Logo, screenshots, founder bio — expand per SHIP-PLAN day 6.</p>",
      "  <ul>",
      "    <li><a href=\"../landing.html\">Landing</a></li>",
      "    <li><a href=\"../investor-deck.html\">Investor deck</a></li>",
      "    <li><a href=\"https://github.com/jordanz00/encore\">GitHub</a></li>",
      "  </ul>",
      "</body>",
      "</html>",
      ""
    ].join("\n")
  );
}

module.exports = {
  waitlistRoute: waitlistRoute,
  transparencyPage: transparencyPage,
  pressKit: pressKit
};
