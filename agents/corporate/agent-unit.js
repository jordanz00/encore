"use strict";

var fs = require("fs");
var path = require("path");
var corp = require("./shared");

function fileOk(rel) {
  if (!rel) return false;
  var p = rel.replace(/\/$/, "");
  var full = path.join(corp.ROOT, p);
  if (fs.existsSync(full)) return true;
  try {
    var dir = path.join(corp.ROOT, p.split("/")[0]);
    return fs.existsSync(dir);
  } catch (e) {
    return false;
  }
}

function runAgent(agent, division) {
  var proposals = [];
  var issues = [];
  var files = agent.files || [];

  files.forEach(function (rel) {
    if (!fileOk(rel)) {
      issues.push("missing:" + rel);
    }
  });

  if (issues.length) {
    proposals.push(corp.createCorpProposal(agent, division.id, {
      division: division.id,
      changeType: "implementation",
      targetFile: files[0] || "README.md",
      description: agent.name + ": restore " + issues.join(", "),
      shipReadiness: 8,
      issue: issues.join("; ")
    }));
  }

  if (agent.handler) {
    var target = files[0] || "landing.html";
    proposals.push(corp.createCorpProposal(agent, division.id, {
      division: division.id,
      changeType: "auto-apply",
      targetFile: target,
      description: agent.name + ": apply " + agent.handler,
      handlerKey: agent.handler,
      shipReadiness: 8,
      artistImpact: 7
    }));
  }

  if (/payments\.ts/.test(files.join(" ")) && !corp.encoreShared.grepFile("apps/api/src/routes/payments.ts", /AGENT:wallet-ledger/)) {
    proposals.push(corp.createCorpProposal(agent, division.id, {
      division: division.id,
      targetFile: "apps/api/src/routes/payments.ts",
      description: agent.name + ": wallet ledger scaffold",
      handlerKey: "payments.wallet-scaffold",
      artistImpact: 10,
      economicsTrust: 10
    }));
  }

  if (/landing\.html/.test(files.join(" ")) && !corp.encoreShared.grepFile("landing.html", /data-encore-beta-cta/)) {
    proposals.push(corp.createCorpProposal(agent, division.id, {
      division: division.id,
      targetFile: "landing.html",
      description: agent.name + ": beta CTA on landing",
      handlerKey: "landing.beta-cta",
      designCraft: 8,
      shipReadiness: 9
    }));
  }

  if (/server\.ts/.test(files.join(" ")) && !corp.encoreShared.grepFile("apps/api/src/server.ts", /registerWaitlist/)) {
    proposals.push(corp.createCorpProposal(agent, division.id, {
      division: division.id,
      targetFile: "apps/api/src/server.ts",
      description: agent.name + ": wire waitlist route in server",
      handlerKey: "server.register-waitlist",
      shipReadiness: 9
    }));
  }

  if (/press/.test((agent.name || "").toLowerCase()) || /ship/i.test((agent.name || ""))) {
    proposals.push(corp.createCorpProposal(agent, division.id, {
      division: division.id,
      targetFile: "press/index.html",
      description: agent.name + ": press kit page",
      handlerKey: "stubs.press-kit",
      shipReadiness: 8
    }));
  }

  return {
    agentId: agent.id,
    agentName: agent.name,
    supervisorId: division.id,
    proposals: proposals,
    issues: issues,
    status: issues.length ? "WARN" : "OK"
  };
}

module.exports = { runAgent: runAgent };
