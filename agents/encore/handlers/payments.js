"use strict";

var fs = require("fs");
var path = require("path");
var shared = require("../shared");

function walletScaffold() {
  var rel = "apps/api/src/routes/payments.ts";
  var full = path.join(shared.ROOT, rel);
  if (!fs.existsSync(full)) {
    return { ok: false, reason: "missing_payments_route" };
  }
  var body = fs.readFileSync(full, "utf8");
  if (/AGENT:wallet-ledger/i.test(body)) {
    return { ok: true, changed: false, file: rel };
  }
  var marker =
    "\n// AGENT:wallet-ledger — on Stripe webhook: credit wallet_ledger per ARTIST-INCOME-GUARANTEE.md\n";
  fs.writeFileSync(full, body + marker, "utf8");
  return { ok: true, changed: true, file: rel };
}

module.exports = { walletScaffold: walletScaffold };
