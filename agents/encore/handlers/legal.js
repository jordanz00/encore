"use strict";

var fs = require("fs");
var path = require("path");
var shared = require("../shared");

function ensureLegalPage(rel, html) {
  var full = path.join(shared.ROOT, rel);
  if (fs.existsSync(full)) return { ok: true, changed: false, file: rel };
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html, "utf8");
  return { ok: true, changed: true, file: rel };
}

function legalHub() {
  return ensureLegalPage(
    "legal/index.html",
    "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Legal</title></head><body><h1>Legal</h1><p><a href=\"terms.html\">Terms</a></p></body></html>"
  );
}

module.exports = { legalHub: legalHub };
