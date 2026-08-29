/**
 * Backend data contracts (DTOs).
 *
 * Verified directly against the live backend source (TechCey-Backend, sibling repo)
 * on 2026-08-27 — these are no longer guesses from the task brief. Replace with
 * generated types once services are reachable via OpenAPI:
 *   pnpm --filter web api:types   (see package.json — generates from /api-docs)
 * Do not let three developers hand-type these three different ways.
 *
 * Money fields are the branded `Money` string type — never a number.
 * See core/api/money.ts.
 */

import type { Money } from "@/core/api/money";

/* ------------------------------- product-service ------------------------------- */

export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductResponse {
  id: number; // BIGSERIAL
  name: string;
  description: string | null;
  price: Money; // NUMERIC(12,2) as string
  imageUrl: string | null; // nullable — always needs a fallback
  stock: number;
  category: CategoryResponse; // embedded, not a bare categoryId
  createdAt: string; // ISO-8601
  updatedAt: string;
}

/** product list query params (mirror product-service). */
export interface ProductListParams {
  keyword?: string;
  categoryId?: number;
  minPrice?: string;
  maxPrice?: string;
  page?: number; // default 0
  size?: number; // default 20
  sort?: string; // e.g. "price,desc"
}

/* -------------------------------- cart-service -------------------------------- */

export interface CartItemResponse {
  productId: number;
  productName: string;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
}

export interface CartResponse {
  userId: string;
  items: CartItemResponse[];
  totalQuantity: number;
  totalPrice: Money;
}

export interface AddCartItemRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface MergeCartRequest {
  items: AddCartItemRequest[];
}

/* ------------------------------- order-service --------------------------------- */

export type OrderStatus = "PENDING" | "AWAITING_PAYMENT" | "CONFIRMED" | "PAID" | "CANCELLED" | "FAILED";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "PENDING",
  "AWAITING_PAYMENT",
  "CONFIRMED",
  "PAID",
  "CANCELLED",
  "FAILED",
] as const;

export interface ShippingAddress {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string; // DB default 'US'
}

export interface OrderItemResponse {
  id: string; // UUID
  productId: number;
  productName: string; // snapshot at order time
  productSku: string; // snapshot at order time
  unitPrice: Money;
  quantity: number;
  subtotal: Money;
}

export interface OrderResponse {
  id: string; // UUID
  orderNumber: string; // ORD-<timestamp>-<6-char-random>
  customerId: string; // UUID
  status: OrderStatus;
  totalAmount: Money;
  shippingAddress: ShippingAddress;
  notes: string | null;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderListParams {
  status?: OrderStatus;
  page?: number; // default 0
  size?: number; // default 20
}

/** One line of a checkout request. NOTE: product-service has no SKU field —
 * see features/checkout/README.md for how productSku is derived. */
export interface OrderItemRequest {
  productId: number;
  productName: string;
  productSku: string;
  unitPrice: string; // Money as plain string on the wire
  quantity: number;
}

export interface CreateOrderRequest {
  items: OrderItemRequest[];
  shippingAddress: ShippingAddress;
  notes?: string | null;
}

/* ------------------------------ inventory-service ------------------------------- */

/** Compact availability line — what product listing/detail pages need. */
export interface AvailabilityResponse {
  productId: number;
  quantityAvailable: number;
  inStock: boolean;
  lowStock: boolean;
}

/* -------------------------------- review-service --------------------------------- */

export interface ReviewResponse {
  id: number;
  productId: number;
  userId: string;
  rating: number; // 1-5
  title: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummaryResponse {
  productId: number;
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>; // keyed 1..5
}

export interface ReviewListParams {
  productId?: number;
  userId?: string;
  rating?: number;
  page?: number;
  size?: number;
  sort?: string;
}

export interface CreateReviewRequest {
  productId: number;
  rating: number;
  title?: string;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating: number;
  title?: string;
  comment?: string;
}

/* ----------------------------- notification-service ------------------------------ */

export type NotificationChannel = "EMAIL" | "SMS" | "PUSH" | "IN_APP";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED";

export interface NotificationResponse {
  id: string; // UUID
  channel: NotificationChannel;
  templateCode: string;
  subject: string;
  bodyPreview: string | null; // list view only
  body: string | null; // detail view only
  recipient: string; // masked
  status: NotificationStatus;
  referenceType: string | null;
  referenceId: string | null;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface NotificationListParams {
  channel?: NotificationChannel;
  status?: NotificationStatus;
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}

/* ------------------------------- user-service --------------------------------- */

/**
 * The authenticated caller's own profile — `GET /api/v1/users/me`.
 *
 * `id` and `roles` are derived from the gateway-verified Keycloak token; the
 * remaining fields are read live from Keycloak (user-service stores nothing).
 * `firstName` / `lastName` can be null for accounts that never set them.
 * There is no endpoint to request another user through this contract.
 */
export interface CurrentUserResponse {
  id: string; // Keycloak user UUID (JWT `sub`)
  username: string;
  email: string;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  enabled: boolean;
  roles: string[]; // realm roles from the verified token
}

/**
 * Body of `PATCH /api/v1/users/me`. A customer may change only their own display
 * name; send at least one field, each 1..255 characters. `username`, `email`,
 * `enabled` and `roles` are managed by Keycloak and are NOT editable here.
 */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
}
