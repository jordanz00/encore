"use client";

import { useEffect, useState } from "react";
import {
  UICard,
  UIText,
  TaskStateIndicator,
  mapExecutionStatusToVisual,
  type TaskVisualState,
} from "@encore/ui-system";

interface ExecutionTask {
  id: string;
  domain: string;
  status: string;
  objective: string;
  durationMs: number;
  costUnits: number;
}

interface ExecutionStatusPayload {
  _meta?: { source: string; updatedAt: string; validationStatus: string };
  cycleId?: string;
  finishedAt?: string;
  tasksExecuted?: number;
  patchesApplied?: number;
  tasksRejected?: number;
  tasksBlocked?: number;
  totalOperationCostUnits?: number;
  tasks?: ExecutionTask[];
  nextHighestImpact?: string;
}

function statusLabel(status: string): string {
  if (status === "applied") return "Complete · patched";
  if (status === "validated") return "Complete · validated";
  if (status === "rejected") return "Rejected";
  if (status === "blocked") return "Blocked";
  return status;
}

/** Reads real cycle output from /execution-status.json (written by swarm runCycle). */
export function ExecutionStatusPanel(): JSX.Element {
  const [data, setData] = useState<ExecutionStatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchState, setFetchState] = useState<TaskVisualState>("running");

  useEffect(() => {
    let cancelled = false;
    setFetchState("running");
    fetch("/execution-status.json", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("no_cycle_data");
        return res.json() as Promise<ExecutionStatusPayload>;
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setError(null);
          setFetchState("complete");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setError("No execution cycle data yet. Run: pnpm swarm:cycle");
          setFetchState("failed");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (fetchState === "running") {
    return (
      <UICard>
        <TaskStateIndicator state="running" label="Loading execution status from last cycle…" />
      </UICard>
    );
  }

  if (error || !data?.cycleId) {
    return (
      <UICard>
        <TaskStateIndicator state="failed" label={error ?? "No data"} />
        <UIText variant="small" className="mt-3 block">
          Artifacts: <code>data/swarm/artifacts/</code> · Audit: <code>data/swarm/audit.jsonl</code>
        </UIText>
      </UICard>
    );
  }

  return (
    <div className="space-y-6">
      <UICard className="dark:bg-[#0b0c10] dark:text-[rgba(255,255,255,0.92)]">
        <TaskStateIndicator state="complete" label={`Cycle ${data.cycleId}`} />
        <UIText variant="body" className="mt-3 m-0 dark:text-[rgba(255,255,255,0.92)]">
          {data.tasksExecuted ?? 0} tasks · {data.patchesApplied ?? 0} patches ·{" "}
          {data.totalOperationCostUnits?.toFixed(2) ?? "0"} cost units
        </UIText>
        <UIText variant="small" className="mt-1 block">
          Updated {data.finishedAt ?? data._meta?.updatedAt ?? "—"}
        </UIText>
        <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm m-0">
          <div>
            <dt className="m-0 opacity-65 text-sm">Rejected</dt>
            <dd className="font-semibold m-0 mt-1">{data.tasksRejected ?? 0}</dd>
          </div>
          <div>
            <dt className="m-0 opacity-65 text-sm">Blocked</dt>
            <dd className="font-semibold m-0 mt-1">{data.tasksBlocked ?? 0}</dd>
          </div>
          <div className="col-span-2">
            <dt className="m-0 opacity-65 text-sm">Next</dt>
            <dd className="m-0 mt-1 leading-snug">{data.nextHighestImpact ?? "—"}</dd>
          </div>
        </dl>
      </UICard>

      <ul className="list-none m-0 p-0 space-y-3" aria-label="Task results">
        {(data.tasks ?? []).map((t) => {
          const visual = mapExecutionStatusToVisual(t.status);
          return (
            <li key={t.id}>
              <UICard className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="text-xs font-mono opacity-50">{t.domain}</span>
                  <p className="m-0 mt-1 text-sm font-medium">{t.objective}</p>
                </div>
                <TaskStateIndicator
                  state={visual}
                  label={statusLabel(t.status)}
                  logHref={
                    visual === "failed"
                      ? `../../data/swarm/artifacts/reports/${data.cycleId}/${t.id}.json`
                      : undefined
                  }
                />
              </UICard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
