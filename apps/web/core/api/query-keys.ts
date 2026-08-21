/**
 * Centralised TanStack Query keys — the frontend equivalent of the backend's
 * Topics.java: ONE source of truth so three developers' read-hooks and
 * invalidate-hooks never drift apart.
 *
 * Convention (documented in FRONTEND_DEVELOPER_GUIDE.md):
 *   [domain]                          -> everything in a domain (broad invalidate)
 *   [domain, 'list', filters?]        -> a list, optionally filtered
 *   [domain, 'detail', id]            -> a single entity
 *
 * Never hand-write a key array in a component or hook. Always call these.
 * Example invalidate: queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
 */

import type { OrderListParams, ProductListParams } from "@/core/api/types";

export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (filters?: ProductListParams) => ["products", "list", filters ?? {}] as const,
    detail: (id: number) => ["products", "detail", id] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: () => ["categories", "list"] as const,
    detail: (id: number) => ["categories", "detail", id] as const,
  },
  cart: {
    all: ["cart"] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (filters?: OrderListParams) => ["orders", "list", filters ?? {}] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },
} as const;
