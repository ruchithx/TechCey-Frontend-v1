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

import type {
  NotificationListParams,
  OrderListParams,
  ProductListParams,
  ReviewListParams,
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
  cart: {
    all: ["cart"] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (filters?: OrderListParams) => ["orders", "list", filters ?? {}] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },
  inventory: {
    all: ["inventory"] as const,
    byProductId: (productId: number) => ["inventory", "detail", productId] as const,
    batch: (productIds: number[]) => ["inventory", "batch", [...productIds].sort((a, b) => a - b)] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    list: (filters?: ReviewListParams) => ["reviews", "list", filters ?? {}] as const,
    summary: (productId: number) => ["reviews", "summary", productId] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (filters?: NotificationListParams) => ["notifications", "list", filters ?? {}] as const,
    unreadCount: () => ["notifications", "unread-count"] as const,
  },
  users: {
    all: ["users"] as const,
    me: () => ["users", "me"] as const,
  },
  customers: {
    all: ["customers"] as const,
    me: () => ["customers", "me"] as const,
    addresses: () => ["customers", "addresses"] as const,
  },
} as const;
