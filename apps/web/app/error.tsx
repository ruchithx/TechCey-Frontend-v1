"use client";

/** Global error boundary for render crashes (D4 / error-handling layer 1).
 * Data-fetch failures are handled by React Query error state, and mutation
 * failures by toasts — this catches unexpected render-time exceptions only. */

import { useEffect } from "react";
import { Button } from "@repo/ui/components/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO(observability): forward to error tracking (Sentry) when configured.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <h1 className="font-display text-2xl font-semibold text-foreground">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">
        An unexpected error occurred. You can try again — if it keeps happening, please contact support.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
