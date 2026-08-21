/**
 * Starts the MSW worker in the browser when enabled. Off by default in prod.
 *
 * Build-time guard: MSW must never ship to production. If someone sets
 * NEXT_PUBLIC_ENABLE_MSW=true in a production build, we throw immediately rather
 * than silently mocking real traffic.
 */

import { env } from "@/core/config/env";

let started = false;

export async function startMocks(): Promise<void> {
  if (!env.enableMsw) return;

  if (env.isProduction) {
    throw new Error(
      "[msw] Refusing to start: mocks are enabled (NEXT_PUBLIC_ENABLE_MSW=true) in a production build.",
    );
  }
  if (started || typeof window === "undefined") return;
  started = true;

  const { worker } = await import("@/mocks/browser");
  await worker.start({
    onUnhandledRequest: "bypass", // let non-API requests (fonts, images) through
  });
}
