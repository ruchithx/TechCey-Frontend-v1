/**
 * Backend data contracts (DTOs).
 *
 * TODO(openapi): These are hand-written from the task brief §1 to match the live
 * DB schema. Replace with generated types once services are reachable:
 *   pnpm --filter web api:types   (see package.json — generates from /api-docs)
 * Do not let three developers hand-type these three different ways.
 *
 * Money fields are the branded `Money` string type — never a number.
 * See core/api/money.ts.
 */

import type { Money } from "@/core/api/money";

/* ------------------------------- product-service ------------------------------- */

export interface ProductResponse {
  id: number; // BIGSERIAL
  name: string;
  description: string | null;
  price: Money; // NUMERIC(12,2) as string
  imageUrl: string | null; // nullable — always needs a fallback
  stock: number;
  categoryId: number;
  createdAt: string; // ISO-8601
  updatedAt: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
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
  imageUrl: string | null;
  unitPrice: Money;
  quantity: number;
  subtotal: Money;
}

export interface CartResponse {
  userId: string;
  items: CartItemResponse[];
  totalAmount: Money;
  itemCount: number;
}

/* ------------------------------- order-service -------------------------------- */

export type OrderStatus = "PENDING" | "CONFIRMED" | "PAID" | "CANCELLED" | "FAILED";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "PENDING",
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
  userId: string; // UUID
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
