import type { TaskDomain } from "./types.js";

export interface AgentDefinition {
  domain: TaskDomain;
  name: string;
  description: string;
  scanRoots: string[];
}

export const AGENT_REGISTRY: AgentDefinition[] = [
  {
    domain: "research",
    name: "Research",
    description: "Backlog + docs — blocked output, no auto-patch",
    scanRoots: ["docs"],
  },
  {
    domain: "backend",
    name: "Backend",
    description: "API, wallet, federation — financial gate when constrained",
    scanRoots: ["apps/api"],
  },
  {
    domain: "frontend",
    name: "Frontend",
    description: "Next.js — vertical slice wiring checks",
    scanRoots: ["apps/web"],
  },
  {
    domain: "mobile",
    name: "Mobile",
    description: "Expo parity checks",
    scanRoots: ["apps/mobile"],
  },
  {
    domain: "accessibility",
    name: "Accessibility",
    description: "WCAG gate — may emit WRITE patches (skip link)",
    scanRoots: ["apps/web", "apps/mobile"],
  },
  {
    domain: "media",
    name: "Media",
    description: "Worker + playback pipeline",
    scanRoots: ["apps/worker", "packages/audio"],
  },
];
