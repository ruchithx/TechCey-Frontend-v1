/**
 * Every backend path, in one file. NOTHING else in the app may contain a URL
 * path string — keep this the single source of truth.
 *
 * The gateway routes by prefix (ADMIN_API.md §1). Two prefixes exist because the
 * backend is inconsistent: product uses `/api/...`, the rest use `/api/v1/...`.
 * Paths are relative to the gateway base URL (core/config/env.ts → apiBaseUrl).
 */

const API = "/api";
const API_V1 = "/api/v1";

export const ENDPOINTS = {
  products: {
    list: () => `${API}/products`,
    byId: (id: number) => `${API}/products/${id}`,
    create: () => `${API}/products`,
    update: (id: number) => `${API}/products/${id}`,
    remove: (id: number) => `${API}/products/${id}`,
  },
  categories: {
    list: () => `${API}/categories`,
    byId: (id: number) => `${API}/categories/${id}`,
    create: () => `${API}/categories`,
    update: (id: number) => `${API}/categories/${id}`,
    remove: (id: number) => `${API}/categories/${id}`,
  },
  inventory: {
    lowStock: () => `${API_V1}/inventory/low-stock`,
    create: () => `${API_V1}/inventory`,
    byProduct: (productId: number) => `${API_V1}/inventory/${productId}`,
    setStock: (productId: number) => `${API_V1}/inventory/${productId}`,
    adjust: (productId: number) => `${API_V1}/inventory/${productId}/adjust`,
    reorderLevel: (productId: number) => `${API_V1}/inventory/${productId}/reorder-level`,
    movements: (productId: number) => `${API_V1}/inventory/${productId}/movements`,
  },
  orders: {
    byId: (id: string) => `${API_V1}/orders/${id}`,
    remove: (id: string) => `${API_V1}/orders/${id}`, // ADMIN only
  },
  notifications: {
    send: () => `${API_V1}/notifications`,
    retry: (id: string) => `${API_V1}/notifications/${id}/retry`,
    admin: () => `${API_V1}/notifications/admin`,
    adminFailed: () => `${API_V1}/notifications/admin/failed`,
  },
  templates: {
    list: () => `${API_V1}/notification-templates`,
    create: () => `${API_V1}/notification-templates`,
    byId: (id: number) => `${API_V1}/notification-templates/${id}`,
    update: (id: number) => `${API_V1}/notification-templates/${id}`,
    remove: (id: number) => `${API_V1}/notification-templates/${id}`,
    preview: (id: number) => `${API_V1}/notification-templates/${id}/preview`,
  },
  reviews: {
    remove: (id: string) => `${API_V1}/reviews/${id}`, // ADMIN may delete any
  },
} as const;
