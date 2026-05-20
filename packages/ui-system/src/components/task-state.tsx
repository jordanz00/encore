"use client";

import clsx from "clsx";

/**
 * Maps to real execution / queue states only — no decorative spinners.
 */
export type TaskVisualState =
  | "queued"
  | "running"
  | "validating"
  | "complete"
  | "failed";

export function mapExecutionStatusToVisual(status: string): TaskVisualState {
  if (status === "rejected" || status === "blocked") return "failed";
  if (status === "applied" || status === "validated" || status === "complete") return "complete";
  if (status === "running") return "running";
  return "queued";
}

export interface TaskStateIndicatorProps {
  state: TaskVisualState;
  label: string;
  logHref?: string;
  className?: string;
}

export function TaskStateIndicator({
  state,
  label,
  logHref,
  className,
}: TaskStateIndicatorProps): JSX.Element {
  return (
    <span className={clsx("encore-ui-task-state", `encore-ui-task-state--${state}`, className)}>
      <span className="encore-ui-task-state__dot" aria-hidden="true" />
      <span className="encore-ui-task-state__label">{label}</span>
      {state === "failed" && logHref ? (
        <a href={logHref} className="encore-ui-task-state__log">
          View log
        </a>
      ) : null}
    </span>
  );
}
