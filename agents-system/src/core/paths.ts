import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(HERE, "../../..");

export const SWARM_DATA_DIR = path.join(REPO_ROOT, "data", "swarm");
export const SWARM_TASK_STORE = path.join(SWARM_DATA_DIR, "task-store.json");
export const SWARM_AUDIT_LOG = path.join(SWARM_DATA_DIR, "audit.jsonl");
export const SWARM_QUEUE_LEGACY = path.join(SWARM_DATA_DIR, "queue.json");
export const SWARM_PATCH_STAGING = path.join(SWARM_DATA_DIR, "staging");
export const SWARM_ARCHIVE_DIR = path.join(REPO_ROOT, "data", "archive", "swarm");
export const SWARM_LATEST_CYCLE = path.join(SWARM_ARCHIVE_DIR, "latest-cycle.json");
export const SWARM_LATEST_MD = path.join(SWARM_ARCHIVE_DIR, "latest-cycle.md");
export const SWARM_RISK_REPORT = path.join(SWARM_ARCHIVE_DIR, "risk-report.md");

/** Observable execution artifacts (logs, patches, reports, metrics). */
export const ARTIFACTS_ROOT = path.join(SWARM_DATA_DIR, "artifacts");
export const ARTIFACTS_LOGS = path.join(ARTIFACTS_ROOT, "logs");
export const ARTIFACTS_PATCHES = path.join(ARTIFACTS_ROOT, "patches");
export const ARTIFACTS_REPORTS = path.join(ARTIFACTS_ROOT, "reports");
export const ARTIFACTS_METRICS = path.join(ARTIFACTS_ROOT, "metrics");

/** Real execution status for web UI (written each cycle). */
export const SWARM_UI_STATUS = path.join(REPO_ROOT, "apps/web/public/execution-status.json");
export const SWARM_UI_STATUS_ARCHIVE = path.join(SWARM_ARCHIVE_DIR, "execution-status.json");
