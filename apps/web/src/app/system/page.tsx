import { ExecutionStatusPanel } from "@/components/ExecutionStatusPanel";
import { UIAmbientBackground, UIText } from "@encore/ui-system";

export const metadata = {
  title: "Execution status — Encore",
  description: "Observable engineering pipeline — real cycle data only.",
};

export default function SystemPage(): JSX.Element {
  return (
    <>
      <UIAmbientBackground />
      <div className="encore-page max-w-prose-wide relative">
        <header className="encore-page-header">
          <UIText variant="h1" className="encore-page-title">
            Execution
          </UIText>
          <UIText variant="body" className="encore-page-lead mt-2">
            Live view of the last swarm cycle. Motion maps to real fetch and task states only — run{" "}
            <code className="text-sm font-mono">pnpm swarm:cycle</code> first.
          </UIText>
        </header>
        <ExecutionStatusPanel />
      </div>
    </>
  );
}
