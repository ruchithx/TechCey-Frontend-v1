/**
 * TanStack Query client factory with app-wide defaults.
 *
 * Retry policy: never retry a 4xx (a 404/403/409 will not fix itself); retry
 * server/network errors up to twice. staleTime is a sane global default that
 * individual hooks override per data type (catalog can be stale longer than
 * cart). SSR-safe singleton handling lives in app/providers.tsx.
 */

import { QueryClient } from "@tanstack/react-query";
import { isAppError } from "@/core/errors/app-error";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isAppError(error) && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
