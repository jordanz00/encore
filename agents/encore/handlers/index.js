"use strict";

var landing = require("./landing");
var docs = require("./docs");
var stubs = require("./stubs");
var payments = require("./payments");
var corporate = require("./corporate");
var server = require("./server");
var batchLog = require("./batch-log");
var legal = require("./legal");

var REGISTRY = {};

function register(key, fn) {
  REGISTRY[key] = fn;
}

register("landing.demo-sandbox-note", landing.demoSandboxNote);
register("landing.beta-cta", landing.betaCta);
register("landing.anti-token", landing.antiToken);
register("landing.guarantee-link", landing.guaranteeLink);
register("landing.reduced-motion", landing.reducedMotion);
register("docs.agent-status", docs.agentStatus);
register("docs.cycle-log", docs.cycleLog);
register("stubs.waitlist-route", stubs.waitlistRoute);
register("stubs.transparency-page", stubs.transparencyPage);
register("stubs.press-kit", stubs.pressKit);
register("payments.wallet-scaffold", payments.walletScaffold);
register("docs.corporate-status", corporate.corporateStatus);
register("server.register-waitlist", server.registerWaitlist);
register("docs.batch-cycle-log", batchLog.appendBatchLine);
register("stubs.legal-hub", legal.legalHub);

function apply(handlerKey, ctx) {
  var fn = REGISTRY[handlerKey];
  if (!fn) return { ok: false, skipped: true, reason: "no_handler:" + handlerKey };
  try {
    return fn(ctx);
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function listHandlers() {
  return Object.keys(REGISTRY);
}

module.exports = { apply: apply, listHandlers: listHandlers, register: register };
