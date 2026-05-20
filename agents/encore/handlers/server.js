"use strict";

var fs = require("fs");
var path = require("path");
var shared = require("../shared");

function registerWaitlist() {
  var rel = "apps/api/src/server.ts";
  var full = path.join(shared.ROOT, rel);
  if (!fs.existsSync(full)) return { ok: false, reason: "no_server" };
  var body = fs.readFileSync(full, "utf8");
  if (/registerWaitlist/i.test(body)) return { ok: true, changed: false, file: rel };

  if (!fs.existsSync(path.join(shared.ROOT, "apps/api/src/routes/waitlist.ts"))) {
    return { ok: false, reason: "waitlist_route_missing" };
  }

  body = body.replace(
    'import { registerRadio } from "./routes/radio.js";',
    'import { registerRadio } from "./routes/radio.js";\nimport { registerWaitlist } from "./routes/waitlist.js";'
  );
  body = body.replace(
    "await app.register(registerRadio, { prefix: \"/radio\" });",
    "await app.register(registerRadio, { prefix: \"/radio\" });\n  await app.register(registerWaitlist, { prefix: \"/waitlist\" });"
  );
  fs.writeFileSync(full, body, "utf8");
  return { ok: true, changed: true, file: rel };
}

module.exports = { registerWaitlist: registerWaitlist };
