"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { makeQueryClient } from "@/core/api/query-client";
import { AuthProvider } from "@/core/auth";
import { ToastProvider } from "@/components/shared/toast";
import { startMocks } from "@/mocks/start";
import { env } from "@/core/config/env";

// SSR-safe singleton: one client in the browser, a fresh one per server render.
let browserQueryClient: ReturnType<typeof makeQueryClient> | undefined;
function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  // Gate rendering on MSW being ready (only matters when mocks are enabled).
  const [mocksReady, setMocksReady] = useState(!env.enableMsw);

  useEffect(() => {
    if (env.enableMsw) startMocks().finally(() => setMocksReady(true));
  }, []);

  if (!mocksReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
      {env.isDevelopment ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
