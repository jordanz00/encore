import fs from "node:fs";
import { SWARM_AUDIT_LOG, SWARM_DATA_DIR } from "./paths.js";

export type AuditEvent =
  | "CYCLE_START"
  | "CYCLE_END"
  | "TASK_START"
  | "TASK_AGENT_DONE"
  | "TASK_VALIDATED"
  | "TASK_REJECTED"
  | "TASK_PATCH_APPLIED"
  | "TASK_PATCH_SKIPPED"
  | "TASK_COMPLETE"
  | "TASK_BLOCKED"
  | "TASK_REQUEUED";

export interface AuditEntry {
  ts: string;
  event: AuditEvent;
  taskId?: string;
  cycleId?: string;
  detail?: string;
  meta?: Record<string, unknown>;
}

function ensure(): void {
  if (!fs.existsSync(SWARM_DATA_DIR)) fs.mkdirSync(SWARM_DATA_DIR, { recursive: true });
}

/** Append-only audit log (investor-grade trace). */
export const auditLog = {
  write(event: AuditEvent, taskId?: string, detail?: string, meta?: Record<string, unknown>): void {
    ensure();
    const entry: AuditEntry = {
      ts: new Date().toISOString(),
      event,
      taskId,
      detail,
      meta,
    };
    fs.appendFileSync(SWARM_AUDIT_LOG, JSON.stringify(entry) + "\n", "utf8");
  },

  writeCycle(cycleId: string, event: AuditEvent, detail?: string): void {
    ensure();
    const entry: AuditEntry = {
      ts: new Date().toISOString(),
      event,
      cycleId,
      detail,
    };
    fs.appendFileSync(SWARM_AUDIT_LOG, JSON.stringify(entry) + "\n", "utf8");
  },

  tail(limit = 20): AuditEntry[] {
    if (!fs.existsSync(SWARM_AUDIT_LOG)) return [];
    const lines = fs.readFileSync(SWARM_AUDIT_LOG, "utf8").trim().split("\n").filter(Boolean);
    return lines.slice(-limit).map((l) => JSON.parse(l) as AuditEntry);
  },
};
