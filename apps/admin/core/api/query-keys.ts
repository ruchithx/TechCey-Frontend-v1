/**
 * Centralised TanStack Query keys — ONE source of truth so read-hooks and
 * invalidate-hooks never drift apart.
 *
 * Convention:
 *   [domain]                    -> everything in a domain (broad invalidate)
 *   [domain, 'list', filters?]  -> a list, optionally filtered
 *   [domain, 'detail', id]      -> a single entity
 *
 * Never hand-write a key array in a component or hook. Always call these.
 */

import type {
  MovementListParams,
  NotificationListParams,
  ProductListParams,
  TemplateListParams,
} from "@/core/api/types";

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
  inventory: {
    all: ["inventory"] as const,
    lowStock: () => ["inventory", "low-stock"] as const,
    detail: (productId: number) => ["inventory", "detail", productId] as const,
    movements: (productId: number, filters?: MovementListParams) =>
      ["inventory", "movements", productId, filters ?? {}] as const,
  },
  orders: {
    all: ["orders"] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (filters?: NotificationListParams) => ["notifications", "list", filters ?? {}] as const,
    failed: (page: number, size: number) => ["notifications", "failed", page, size] as const,
  },
  templates: {
    all: ["templates"] as const,
    list: (filters?: TemplateListParams) => ["templates", "list", filters ?? {}] as const,
    detail: (id: number) => ["templates", "detail", id] as const,
  },
} as const;
