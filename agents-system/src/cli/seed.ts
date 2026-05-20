#!/usr/bin/env node
import { taskStore } from "../core/task-store.js";
import type { TaskDomain } from "../core/types.js";

const DEFAULT_TASKS: Array<{
  domain: TaskDomain;
  objective: string;
  priority: number;
  constraints?: {
    accessibilityRequired?: boolean;
    costAware?: boolean;
    appleUIRequired?: boolean;
  };
  context?: { systemImpact?: "low" | "medium" | "high"; filesTouched?: string[] };
}> = [
  {
    domain: "research",
    objective: "Scan BACKLOG and CORPORATION-STATUS for P0/P1 gaps",
    priority: 10,
    context: { systemImpact: "low", filesTouched: ["docs/BACKLOG.md"] },
  },
  {
    domain: "backend",
    objective: "Audit API payments wallet federation — cost-aware ledger safety",
    priority: 9,
    constraints: { costAware: true },
    context: {
      systemImpact: "high",
      filesTouched: ["apps/api/src/routes/payments.ts", "apps/api/src/lib/wallet-ledger.ts"],
    },
  },
  {
    domain: "frontend",
    objective: "Audit web stubs checkout player dashboard",
    priority: 8,
    constraints: { accessibilityRequired: true, appleUIRequired: true },
    context: { systemImpact: "medium", filesTouched: ["apps/web/src", "design/encore-apple-system.css"] },
  },
  {
    domain: "mobile",
    objective: "Audit Expo search artist playback parity",
    priority: 7,
    context: { systemImpact: "medium", filesTouched: ["apps/mobile/src"] },
  },
  {
    domain: "accessibility",
    objective: "WCAG 2.2 AA gate — skip link, reduced motion, safe DOM",
    priority: 10,
    constraints: { accessibilityRequired: true, appleUIRequired: true },
    context: { systemImpact: "low", filesTouched: ["apps/web/src/app/layout.tsx", "design/encore-apple-system.css"] },
  },
  {
    domain: "media",
    objective: "Audit transcode outbox HLS playback pipeline",
    priority: 7,
    context: {
      systemImpact: "medium",
      filesTouched: ["apps/worker/src/jobs/outbox.ts", "apps/web/src/components/Player.tsx"],
    },
  },
];

const added = taskStore.seedUnique(
  DEFAULT_TASKS.map((t) => ({
    domain: t.domain,
    objective: t.objective,
    priority: t.priority,
    constraints: {
      productionReady: true,
      accessibilityRequired: t.constraints?.accessibilityRequired ?? false,
      noFakeImplementations: true,
      costAware: t.constraints?.costAware ?? true,
      appleUIRequired: t.constraints?.appleUIRequired ?? false,
    },
    context: {
      filesTouched: t.context?.filesTouched ?? [],
      systemImpact: t.context?.systemImpact ?? "low",
    },
  })),
);

const counts = taskStore.counts();
console.log(`Seeded ${added} task(s). Store: ${JSON.stringify(counts)}`);
