import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage(): JSX.Element {
  return (
    <div className="encore-page max-w-md">
      <Suspense
        fallback={
          <p className="text-sm text-ink-muted dark:text-[#a8a8b4]" role="status">
            Loading…
          </p>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
