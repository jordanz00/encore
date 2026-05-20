"use strict";

var fs = require("fs");
var path = require("path");
var shared = require("../shared");

function writeIfChanged(rel, next) {
  var full = path.join(shared.ROOT, rel);
  var prev = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
  if (prev === next) return { ok: true, changed: false, file: rel };
  fs.writeFileSync(full, next, "utf8");
  return { ok: true, changed: true, file: rel };
}

function demoSandboxNote() {
  var rel = "landing.html";
  var html = shared.readProjectFile(rel);
  if (!html) return { ok: false, reason: "missing_landing" };
  if (/data-encore-demo-wallet/i.test(html)) return { ok: true, changed: false, file: rel };
  var marker =
    '<p class="economics-demo-note" data-encore-demo-wallet="1">' +
    "<strong>Sandbox wallet:</strong> Demo credits (+$0.024/play) illustrate UX only. " +
    "Live Discovery Dividend and subscription pool rates publish at " +
    '<a href="transparency/index.html">encore.audio/transparency</a> when pools are active.</p>';
  if (html.indexOf('class="economics-demo-note"') !== -1) {
    html = html.replace(
      /<p class="economics-demo-note">[\s\S]*?<\/p>/,
      marker
    );
  } else {
    html = html.replace(
      "</section>",
      marker + "\n      </section>",
      1
    );
  }
  return writeIfChanged(rel, html);
}

function betaCta() {
  var rel = "landing.html";
  var html = shared.readProjectFile(rel);
  if (!html) return { ok: false, reason: "missing_landing" };
  if (/data-encore-beta-cta/i.test(html)) return { ok: true, changed: false, file: rel };
  var strip =
    '<p class="beta-cta-strip" data-encore-beta-cta="1" style="margin:var(--s-5) 0;text-align:center;">' +
    '<a href="https://beta.encore.audio" class="btn btn-primary" rel="noopener">Open live beta →</a>' +
    ' <span style="color:var(--ink-dim);font-size:0.9rem;"> or use the showcase player below</span></p>';
  if (html.indexOf("beta-cta-strip") !== -1) return { ok: true, changed: false, file: rel };
  var heroBlock = /(<div class="hero-ctas">[\s\S]*?<\/div>)/;
  if (!heroBlock.test(html)) {
    heroBlock = /(<div class="hero-actions">[\s\S]*?<\/div>)/;
  }
  if (!heroBlock.test(html)) {
    heroBlock = /(<div class="landing-hero-actions">[\s\S]*?<\/div>)/;
  }
  html = html.replace(heroBlock, "$1\n            " + strip);
  return writeIfChanged(rel, html);
}

function antiToken() {
  var rel = "landing.html";
  var html = shared.readProjectFile(rel);
  if (!html) return { ok: false, reason: "missing_landing" };
  if (/data-encore-anti-token/i.test(html)) return { ok: true, changed: false, file: rel };
  var note =
    '<p class="trust-strip" data-encore-anti-token="1" style="font-size:0.85rem;color:var(--ink-muted);max-width:42rem;">' +
    "<strong>No creator coin. No token.</strong> AGPL-3.0 — if Encore ever breaks artist promises, the fork is the real platform. " +
    '<a href="https://github.com/jordanz00/encore">Open source →</a></p>';
  if (/AGPL-3\.0|Federated/i.test(html)) {
    html = html.replace(
      /(<span class="feature-tag">AGPL-3\.0 · ActivityPub<\/span>)/,
      "$1\n            " + note
    );
  } else {
    html = html.replace("<footer", note + "\n  <footer");
  }
  return writeIfChanged(rel, html);
}

function guaranteeLink() {
  var rel = "landing.html";
  var html = shared.readProjectFile(rel);
  if (!html) return { ok: false, reason: "missing_landing" };
  if (/ARTIST-INCOME-GUARANTEE/i.test(html)) return { ok: true, changed: false, file: rel };
  var link =
    ' <a href="https://github.com/jordanz00/encore/blob/main/ARTIST-INCOME-GUARANTEE.md" data-encore-guarantee-link="1">Artist Income Guarantee (source)</a>';
  html = html.replace(
    /(0% platform fee on sales, tips, and listener pools\.)/,
    "$1" + link
  );
  return writeIfChanged(rel, html);
}

function reducedMotion() {
  var rel = "landing.html";
  var html = shared.readProjectFile(rel);
  if (!html) return { ok: false, reason: "missing_landing" };
  if (/@media \(prefers-reduced-motion: reduce\)/i.test(html)) {
    return { ok: true, changed: false, file: rel };
  }
  var block =
    "\n    @media (prefers-reduced-motion: reduce) {\n" +
    "      *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }\n" +
    "      html { scroll-behavior: auto; }\n" +
    "    }\n";
  html = html.replace("</style>", block + "  </style>");
  return writeIfChanged(rel, html);
}

module.exports = {
  demoSandboxNote: demoSandboxNote,
  betaCta: betaCta,
  antiToken: antiToken,
  guaranteeLink: guaranteeLink,
  reducedMotion: reducedMotion
};
