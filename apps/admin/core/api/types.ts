/**
 * Backend data contracts (DTOs) for the admin console.
 *
 * Hand-written from ADMIN_API.md (generated from backend source 2026-08-23).
 * Cross-check against each service's Swagger UI if anything drifts.
 *
 * Money fields use the branded `Money` type — never a raw number.
 * See core/api/money.ts.
 */

import type { Money } from "@/core/api/money";

/* ============================ product-service ============================ */

export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  price: Money; // NUMERIC as string
  imageUrl: string | null;
  stock: number;
  category: CategoryResponse | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  name: string;
  description?: string | null;
  price: string; // send as a decimal string
  imageUrl?: string | null;
  stock: number;
  categoryId: number;
}

// Query-param shapes are `type` aliases (not interfaces) so they satisfy the
// HTTP layer's `Record<string, primitive>` params index signature.
export type ProductListParams = {
  keyword?: string;
  categoryId?: number;
  minPrice?: string;
  maxPrice?: string;
  page?: number; // default 0
  size?: number; // default 20
  sort?: string; // e.g. "price,desc"
};

export interface CategoryRequest {
  name: string;
  description?: string | null;
}

/* =========================== inventory-service =========================== */

export type MovementType =
  | "INBOUND"
  | "RESERVE"
  | "RELEASE"
  | "COMMIT"
  | "ADJUSTMENT"
  | "RETURN"
  | "EXPIRE";

export const MOVEMENT_TYPES: readonly MovementType[] = [
  "INBOUND",
  "RESERVE",
  "RELEASE",
  "COMMIT",
  "ADJUSTMENT",
  "RETURN",
  "EXPIRE",
] as const;

export type AdjustReason =
  | "INBOUND"
  | "DAMAGED"
  | "LOST"
  | "RETURNED"
  | "CORRECTION"
  | "MANUAL";

export const ADJUST_REASONS: readonly AdjustReason[] = [
  "INBOUND",
  "DAMAGED",
  "LOST",
  "RETURNED",
  "CORRECTION",
  "MANUAL",
] as const;

export interface InventoryResponse {
  productId: number;
  sku: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderLevel: number;
  lowStock: boolean;
  inStock: boolean;
  warehouseCode: string;
  updatedAt: string;
}

export interface StockMovementResponse {
  id: number;
  productId: number;
  movementType: MovementType;
  quantityDelta: number;
  onHandAfter: number;
  reservedAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  reason: string | null;
  note: string | null;
  actorId: string | null;
  createdAt: string;
}

export interface CreateInventoryRequest {
  productId: number;
  sku: string;
  quantityOnHand: number;
  reorderLevel?: number; // default 10
  warehouseCode?: string; // default MAIN
}

export interface SetStockRequest {
  quantityOnHand: number;
  note?: string;
}

export interface AdjustStockRequest {
  delta: number; // signed, non-zero
  reason: AdjustReason;
  note?: string;
}

export interface UpdateReorderLevelRequest {
  reorderLevel: number;
}

export type MovementListParams = {
  movementType?: MovementType;
  fromDate?: string; // ISO-8601 date-time
  toDate?: string;
  page?: number; // default 0
  size?: number; // default 50
};

/* ============================= order-service ============================= */

export type OrderStatus = "PENDING" | "CONFIRMED" | "PAID" | "CANCELLED" | "FAILED";

export interface ShippingAddress {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface OrderItemResponse {
  productId: number;
  productName: string;
  productSku: string;
  unitPrice: Money;
  quantity: number;
  subtotal: Money;
}

export interface OrderResponse {
  id: string; // UUID
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  totalAmount: Money;
  shippingAddress: ShippingAddress;
  notes: string | null;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}

/* ========================== notification-service ========================= */

export type NotificationChannel = "EMAIL" | "SMS" | "IN_APP" | "PUSH";

export const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = [
  "EMAIL",
  "SMS",
  "IN_APP",
  "PUSH",
] as const;

export type NotificationStatus =
  | "PENDING"
  | "SENDING"
  | "SENT"
  | "FAILED"
  | "RETRYING"
  | "SUPPRESSED"
  | "CANCELLED";

export const NOTIFICATION_STATUSES: readonly NotificationStatus[] = [
  "PENDING",
  "SENDING",
  "SENT",
  "FAILED",
  "RETRYING",
  "SUPPRESSED",
  "CANCELLED",
] as const;

export interface NotificationResponse {
  id: string;
  channel: NotificationChannel;
  templateCode: string;
  subject: string | null;
  bodyPreview: string | null;
  body: string | null;
  recipient: string; // masked
  status: NotificationStatus;
  referenceType: string | null;
  referenceId: string | null;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface SendNotificationRequest {
  userId?: string;
  recipient?: string;
  channel: NotificationChannel;
  templateCode: string;
  locale?: string;
  priority?: number; // 1–9, default 5
  variables?: Record<string, string>;
  referenceType?: string;
  referenceId?: string;
}

export type NotificationListParams = {
  userId?: string;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  referenceType?: string;
  referenceId?: string;
  page?: number; // default 0
  size?: number; // default 20
};

/* ------------------------------ templates ------------------------------- */

export type TemplateContentType = "TEXT" | "HTML";

export const TEMPLATE_CONTENT_TYPES: readonly TemplateContentType[] = ["TEXT", "HTML"] as const;

export interface TemplateResponse {
  id: number;
  code: string;
  channel: NotificationChannel;
  locale: string;
  subjectTemplate: string | null;
  bodyTemplate: string;
  contentType: TemplateContentType;
  requiredVars: string[];
  description: string | null;
  active: boolean;
  versionNo: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateRequest {
  code: string;
  channel: NotificationChannel;
  locale?: string;
  subjectTemplate?: string | null;
  bodyTemplate: string;
  contentType: TemplateContentType;
  requiredVars?: string[];
  description?: string | null;
}

export interface PreviewRequest {
  variables: Record<string, string>;
}

export interface PreviewResponse {
  subject: string;
  body: string;
  missingVariables: string[];
}

export type TemplateListParams = {
  page?: number;
  size?: number;
};
