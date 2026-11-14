/**
 * Starts the MSW worker in the browser when enabled. Off by default in prod.
 *
 * Build-time guard: MSW must never ship to production. If someone sets
 * NEXT_PUBLIC_ENABLE_MSW=true in a production build, we throw immediately rather
 * than silently mocking real traffic.
 */

import { env } from "@/core/config/env";

// Store the in-flight promise so React Strict Mode's double-invocation of
// useEffect awaits the same worker startup rather than returning immediately
// (which would set mocksReady=true before the worker is actually controlling
// the page, causing queries to hit the real backend).
let workerPromise: Promise<void> | null = null;

export async function startMocks(): Promise<void> {
  if (!env.enableMsw) return;

  if (env.isProduction) {
    throw new Error(
      "[msw] Refusing to start: mocks are enabled (NEXT_PUBLIC_ENABLE_MSW=true) in a production build.",
    );
  }
  if (typeof window === "undefined") return;

  if (!workerPromise) {
    workerPromise = import("@/mocks/browser").then(({ worker }) =>
      worker.start({
        onUnhandledRequest: "bypass", // let non-API requests (fonts, images) through
      }),
    );
  }

  return workerPromise;
}
