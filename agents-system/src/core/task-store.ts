import fs from "node:fs";
import crypto from "node:crypto";
import { SWARM_TASK_STORE, SWARM_DATA_DIR } from "./paths.js";
import type { Task, TaskContext, TaskConstraints, TaskDomain, TaskState } from "./types.js";

interface TaskStoreFile {
  version: 5;
  tasks: Task[];
}

function defaultConstraints(overrides?: Partial<TaskConstraints>): TaskConstraints {
  return {
    productionReady: true,
    accessibilityRequired: false,
    noFakeImplementations: true,
    costAware: true,
    appleUIRequired: false,
    ...overrides,
  };
}

function defaultContext(overrides?: Partial<TaskContext>): TaskContext {
  return {
    filesTouched: overrides?.filesTouched ?? [],
    systemImpact: overrides?.systemImpact ?? "low",
  };
}

function normalizeLegacyTask(raw: Record<string, unknown>): Task {
  const domain = (raw.domain ?? raw.agent ?? "research") as TaskDomain;
  const objective = String(raw.objective ?? raw.goal ?? "legacy task");
  const ctx = (raw.context ?? {}) as Record<string, unknown>;
  const legacyConstraints = (raw.constraints ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id),
    domain,
    objective,
    constraints: {
      productionReady: Boolean(
        legacyConstraints.productionReady ??
          legacyConstraints.mustBeProductionReady ??
          legacyConstraints.productionGradeOnly ??
          true,
      ),
      accessibilityRequired: Boolean(
        legacyConstraints.accessibilityRequired ??
          legacyConstraints.mustBeAccessible ??
          false,
      ),
      noFakeImplementations: Boolean(
        legacyConstraints.noFakeImplementations ?? legacyConstraints.noStubOutputs ?? true,
      ),
      costAware: Boolean(
        legacyConstraints.costAware ??
          legacyConstraints.mustPreserveUnitEconomics ??
          legacyConstraints.financialSafetyRequired ??
          true,
      ),
      appleUIRequired: Boolean(legacyConstraints.appleUIRequired ?? false),
    },
    context: {
      filesTouched: (ctx.filesTouched as string[]) ?? (ctx.repoFiles as string[]) ?? [],
      systemImpact:
        (ctx.systemImpact as Task["context"]["systemImpact"]) ??
        (ctx.riskLevel as Task["context"]["systemImpact"]) ??
        "low",
    },
    state: (raw.state as TaskState) ?? "pending",
    priority: Number(raw.priority ?? 5),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    attempts: Number(raw.attempts ?? 0),
  };
}

function load(): TaskStoreFile {
  if (!fs.existsSync(SWARM_DATA_DIR)) fs.mkdirSync(SWARM_DATA_DIR, { recursive: true });
  if (!fs.existsSync(SWARM_TASK_STORE)) {
    return { version: 5, tasks: [] };
  }
  const raw = JSON.parse(fs.readFileSync(SWARM_TASK_STORE, "utf8")) as {
    version?: number;
    tasks: Record<string, unknown>[];
  };
  return {
    version: 5,
    tasks: raw.tasks.map((t) => normalizeLegacyTask(t)),
  };
}

function save(store: TaskStoreFile): void {
  fs.writeFileSync(SWARM_TASK_STORE, JSON.stringify(store, null, 2) + "\n", "utf8");
}

function newId(): string {
  return `task_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

export const taskStore = {
  list(): Task[] {
    return load().tasks;
  },

  get(id: string): Task | undefined {
    return load().tasks.find((t) => t.id === id);
  },

  upsert(task: Task): void {
    const store = load();
    const idx = store.tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) store.tasks[idx] = task;
    else store.tasks.push(task);
    save(store);
  },

  add(input: {
    domain: TaskDomain;
    objective: string;
    context?: Partial<TaskContext>;
    constraints?: Partial<TaskConstraints>;
    priority?: number;
  }): Task {
    const task: Task = {
      id: newId(),
      domain: input.domain,
      objective: input.objective,
      context: defaultContext(input.context),
      constraints: defaultConstraints(input.constraints),
      state: "pending",
      priority: input.priority ?? 5,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    this.upsert(task);
    return task;
  },

  seedUnique(
    items: Array<{
      domain: TaskDomain;
      objective: string;
      context?: Partial<TaskContext>;
      constraints?: Partial<TaskConstraints>;
      priority?: number;
    }>,
  ): number {
    const store = load();
    const keys = new Set(store.tasks.map((t) => `${t.domain}:${t.objective}`));
    let n = 0;
    for (const item of items) {
      const key = `${item.domain}:${item.objective}`;
      if (keys.has(key)) continue;
      store.tasks.push({
        id: newId(),
        domain: item.domain,
        objective: item.objective,
        context: defaultContext(item.context),
        constraints: defaultConstraints(item.constraints),
        state: "pending",
        priority: item.priority ?? 5,
        createdAt: new Date().toISOString(),
        attempts: 0,
      });
      keys.add(key);
      n += 1;
    }
    save(store);
    return n;
  },

  setState(id: string, state: TaskState): void {
    const t = this.get(id);
    if (!t) return;
    t.state = state;
    this.upsert(t);
  },

  resetStaleRunning(): number {
    const store = load();
    let n = 0;
    for (const t of store.tasks) {
      if (t.state === "running") {
        t.state = "pending";
        n += 1;
      }
    }
    if (n) save(store);
    return n;
  },

  counts(): Record<string, number> {
    const tasks = load().tasks;
    return {
      pending: tasks.filter((t) => t.state === "pending").length,
      running: tasks.filter((t) => t.state === "running").length,
      completed: tasks.filter((t) => t.state === "completed").length,
      rejected: tasks.filter((t) => t.state === "rejected").length,
      blocked: tasks.filter((t) => t.state === "blocked").length,
    };
  },
};
