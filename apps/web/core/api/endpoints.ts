/**
 * Every backend path, in one file. NOTHING else in the app may contain a URL
 * path string — the D5 ESLint rule enforces this.
 *
 * Two prefixes exist today because the backend is inconsistent:
 *   - product/cart use `/api/...`
 *   - order uses `/api/v1/...`
 * They will standardise on `/api/v1/*` later. When they do, this is a ONE-LINE
 * edit (delete API_PREFIX, point everything at API_V1_PREFIX). That is the whole
 * point of centralising here.
 *
 * Paths are relative to the gateway base URL (core/config/env.ts → apiBaseUrl).
 */

const API_PREFIX = "/api";
const API_V1_PREFIX = "/api/v1"; // TODO: collapses to one prefix once backend standardises

export const ENDPOINTS = {
  products: {
    list: () => `${API_PREFIX}/products`,
    byId: (id: number) => `${API_PREFIX}/products/${id}`,
    create: () => `${API_PREFIX}/products`,
    update: (id: number) => `${API_PREFIX}/products/${id}`,
    remove: (id: number) => `${API_PREFIX}/products/${id}`,
  },
  categories: {
    list: () => `${API_PREFIX}/categories`,
    byId: (id: number) => `${API_PREFIX}/categories/${id}`,
    create: () => `${API_PREFIX}/categories`,
    update: (id: number) => `${API_PREFIX}/categories/${id}`,
    remove: (id: number) => `${API_PREFIX}/categories/${id}`,
  },
  cart: {
    get: () => `${API_PREFIX}/cart`,
    addItem: () => `${API_PREFIX}/cart/items`,
    updateItem: (productId: number) => `${API_PREFIX}/cart/items/${productId}`,
    removeItem: (productId: number) => `${API_PREFIX}/cart/items/${productId}`,
    clear: () => `${API_PREFIX}/cart`,
    merge: () => `${API_PREFIX}/cart/merge`, // guest -> user cart merge (see core/auth)
  },
  orders: {
    list: () => `${API_V1_PREFIX}/orders`,
    byId: (id: string) => `${API_V1_PREFIX}/orders/${id}`,
    create: () => `${API_V1_PREFIX}/orders`,
    cancel: (id: string) => `${API_V1_PREFIX}/orders/${id}/cancel`,
    remove: (id: string) => `${API_V1_PREFIX}/orders/${id}`, // ADMIN only
  },
} as const;
