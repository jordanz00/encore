import { Suspense } from "react";
import DashboardView from "./DashboardView";

export default function DashboardPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="encore-page max-w-prose-wide">
          <p role="status" className="text-ink-muted dark:text-[#a8a8b4]">
            Loading dashboard…
          </p>
        </div>
      }
    >
      <DashboardView />
    </Suspense>
  );
}
