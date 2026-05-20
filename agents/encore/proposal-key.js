"use strict";

var crypto = require("crypto");

function fingerprint(proposal) {
  if (proposal.handlerKey) {
    return "handler:" + proposal.handlerKey;
  }
  var raw = [
    proposal.agentId || "",
    proposal.targetFile || "",
    proposal.changeType || "",
    proposal.description || ""
  ].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

module.exports = { fingerprint: fingerprint };
