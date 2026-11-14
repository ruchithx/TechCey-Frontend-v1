/**
 * MSW request handlers for every endpoint in core/api/endpoints.ts, plus the
 * stub services' expected contracts and deliberate failure fixtures.
 *
 * Envelope discipline mirrors the real backend so the unwrap layer is exercised:
 *   - order-service responses are WRAPPED in { success, message, data, timestamp }
 *   - product-service and cart-service responses are BARE
 *
 * URL patterns are derived from ENDPOINTS (+ ':param') so they can't drift from
 * the real paths. This file is exempt from the "no URL literals" lint rule
 * (see eslint.config.js) because MSW needs param patterns ENDPOINTS can't express.
 */

import { http, HttpResponse, delay } from "msw";
import { env } from "@/core/config/env";
import { ENDPOINTS } from "@/core/api/endpoints";
import { toMoney } from "@/core/api/money";
import type { CartResponse, ProductRequest, CategoryRequest } from "@/core/api/types";
import { cart, categories, orders, products } from "@/mocks/fixtures";

// Running ID counters — start above the fixture ceiling so new items never clash.
let nextProductId = 100;
let nextCategoryId = 20;

const base = env.apiBaseUrl;
const P = (path: string) => `${base}${path}`;

function envelope<T>(data: T, message = "Success") {
  return { success: true, message, data, timestamp: new Date().toISOString() };
}

/* -------------------------------- products -------------------------------- */

const productHandlers = [
  http.get(P(ENDPOINTS.products.list()), async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword")?.toLowerCase() ?? "";

    // --- deliberate failure fixtures (D6) ---
    if (keyword === "__slow__") await delay(3000); // loading-state testing
    if (keyword === "__error__") {
      return HttpResponse.json({ error: "SERVER_ERROR", message: "Boom" }, { status: 500 });
    }

    const categoryId = url.searchParams.get("categoryId");
    const page = Number(url.searchParams.get("page") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 20);

    let filtered = products;
    if (keyword) filtered = filtered.filter((p) => p.name.toLowerCase().includes(keyword));
    if (categoryId) filtered = filtered.filter((p) => p.categoryId === Number(categoryId));

    const start = page * size;
    const content = filtered.slice(start, start + size);
    // product-service PageResponse shape (BARE — no envelope).
    return HttpResponse.json({
      content,
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / size)),
    });
  }),

  http.get(P(`${ENDPOINTS.products.list()}/:id`), ({ params }) => {
    const product = products.find((p) => p.id === Number(params.id));
    if (!product) {
      return HttpResponse.json({ error: "NOT_FOUND", message: "Product not found" }, { status: 404 });
    }
    return HttpResponse.json(product);
  }),

  http.post(P(ENDPOINTS.products.create()), async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Partial<ProductRequest>;
    if (!body.name?.trim()) {
      return HttpResponse.json({ error: "BAD_REQUEST", message: "name is required" }, { status: 400 });
    }
    const category = categories.find((c) => c.id === Number(body.categoryId));
    const now = new Date().toISOString();
    const product = {
      id: nextProductId++,
      name: body.name.trim(),
      description: body.description ?? null,
      price: toMoney(String(body.price ?? "0")),
      imageUrl: body.imageUrl ?? null,
      stock: body.stock ?? 0,
      categoryId: Number(body.categoryId ?? 0),
      category: category ? { id: category.id, name: category.name, description: category.description } : undefined,
      createdAt: now,
      updatedAt: now,
    };
    products.push(product);
    return HttpResponse.json(product, { status: 201 });
  }),

  http.put(P(`${ENDPOINTS.products.list()}/:id`), async ({ params, request }) => {
    const id = Number(params.id);
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: "NOT_FOUND", message: "Product not found" }, { status: 404 });
    }
    const body = (await request.json().catch(() => ({}))) as Partial<ProductRequest>;
    const category = categories.find((c) => c.id === Number(body.categoryId));
    const updated = {
      ...products[idx]!,
      name: body.name?.trim() ?? products[idx]!.name,
      description: body.description ?? null,
      price: toMoney(String(body.price ?? products[idx]!.price)),
      imageUrl: body.imageUrl ?? null,
      stock: body.stock ?? products[idx]!.stock,
      categoryId: Number(body.categoryId ?? products[idx]!.categoryId),
      category: category
        ? { id: category.id, name: category.name, description: category.description }
        : products[idx]!.category,
      updatedAt: new Date().toISOString(),
    };
    products[idx] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete(P(`${ENDPOINTS.products.list()}/:id`), ({ params }) => {
    const id = Number(params.id);
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: "NOT_FOUND", message: "Product not found" }, { status: 404 });
    }
    products.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

/* ------------------------------- categories ------------------------------- */

const categoryHandlers = [
  http.get(P(ENDPOINTS.categories.list()), () => HttpResponse.json(categories)),
  http.get(P(`${ENDPOINTS.categories.list()}/:id`), ({ params }) => {
    const category = categories.find((c) => c.id === Number(params.id));
    return category
      ? HttpResponse.json(category)
      : HttpResponse.json({ error: "NOT_FOUND", message: "Category not found" }, { status: 404 });
  }),

  http.post(P(ENDPOINTS.categories.create()), async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Partial<CategoryRequest>;
    if (!body.name?.trim()) {
      return HttpResponse.json({ error: "BAD_REQUEST", message: "name is required" }, { status: 400 });
    }
    const category = {
      id: nextCategoryId++,
      name: body.name.trim(),
      description: body.description ?? null,
    };
    categories.push(category);
    return HttpResponse.json(category, { status: 201 });
  }),

  http.put(P(`${ENDPOINTS.categories.list()}/:id`), async ({ params, request }) => {
    const id = Number(params.id);
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: "NOT_FOUND", message: "Category not found" }, { status: 404 });
    }
    const body = (await request.json().catch(() => ({}))) as Partial<CategoryRequest>;
    const updated = {
      ...categories[idx]!,
      name: body.name?.trim() ?? categories[idx]!.name,
      description: body.description ?? null,
    };
    categories[idx] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete(P(`${ENDPOINTS.categories.list()}/:id`), ({ params }) => {
    const id = Number(params.id);
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: "NOT_FOUND", message: "Category not found" }, { status: 404 });
    }
    categories.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

/* ---------------------------------- cart ---------------------------------- */

function getInitialMockCart(): CartResponse {
  if (typeof window !== "undefined") {
    try {
      const stored = window.sessionStorage.getItem("techcey_mock_cart");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
  }
  return {
    userId: cart.userId,
    items: cart.items.map((i) => ({ ...i })),
    totalPrice: cart.totalPrice,
    totalQuantity: cart.totalQuantity,
  };
}

const mockCart: CartResponse = getInitialMockCart();

function persistMockCart() {
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem("techcey_mock_cart", JSON.stringify(mockCart));
    } catch {
      // ignore
    }
  }
}

function recalculateMockCart() {
  let count = 0;
  let total = 0;
  for (const item of mockCart.items) {
    count += item.quantity;
    total += parseFloat(item.lineTotal);
  }
  mockCart.totalQuantity = count;
  mockCart.totalPrice = toMoney(total.toFixed(2));
  persistMockCart();
}

const cartHandlers = [
  http.get(P(ENDPOINTS.cart.get()), () => HttpResponse.json(mockCart)),

  http.post(P(ENDPOINTS.cart.addItem()), async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      productId?: number;
      quantity?: number;
    };
    const product = products.find((p) => p.id === body.productId);
    if (!product) {
      return HttpResponse.json({ error: "NOT_FOUND", message: "Product not found", status: 404 }, { status: 404 });
    }
    const quantity = Math.max(1, body.quantity ?? 1);
    const existingIndex = mockCart.items.findIndex((i) => i.productId === product.id);
    const existing = existingIndex >= 0 ? mockCart.items[existingIndex] : undefined;
    const totalQty = (existing?.quantity ?? 0) + quantity;

    // 409 insufficient-stock failure fixture (D6) — a user-facing outcome.
    if (totalQty > product.stock) {
      return HttpResponse.json(
        {
          error: "INSUFFICIENT_STOCK",
          errorCode: "INSUFFICIENT_STOCK",
          message: `Only ${product.stock} left in stock`,
          status: 409,
        },
        { status: 409 },
      );
    }

    if (existing) {
      existing.quantity = totalQty;
      existing.lineTotal = toMoney((parseFloat(product.price) * totalQty).toFixed(2));
    } else {
      mockCart.items.push({
        productId: product.id,
        productName: product.name,
        imageUrl: product.imageUrl,
        unitPrice: product.price,
        quantity,
        lineTotal: toMoney((parseFloat(product.price) * quantity).toFixed(2)),
      });
    }

    recalculateMockCart();
    return HttpResponse.json(mockCart);
  }),

  http.put(P(`${ENDPOINTS.cart.addItem()}/:productId`), async ({ params, request }) => {
    const productId = Number(params.productId);
    const body = (await request.json().catch(() => ({}))) as { quantity?: number };
    const quantity = body.quantity ?? 1;
    const product = products.find((p) => p.id === productId);

    if (product && quantity > product.stock) {
      return HttpResponse.json(
        {
          error: "INSUFFICIENT_STOCK",
          errorCode: "INSUFFICIENT_STOCK",
          message: `Only ${product.stock} left in stock`,
          status: 409,
        },
        { status: 409 },
      );
    }

    const itemIndex = mockCart.items.findIndex((i) => i.productId === productId);
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        mockCart.items.splice(itemIndex, 1);
      } else {
        const item = mockCart.items[itemIndex]!;
        item.quantity = quantity;
        item.lineTotal = toMoney((parseFloat(item.unitPrice) * quantity).toFixed(2));
      }
    }
    recalculateMockCart();
    return HttpResponse.json(mockCart);
  }),

  http.delete(P(`${ENDPOINTS.cart.addItem()}/:productId`), ({ params }) => {
    const productId = Number(params.productId);
    mockCart.items = mockCart.items.filter((i) => i.productId !== productId);
    recalculateMockCart();
    return HttpResponse.json(mockCart);
  }),

  http.delete(P(ENDPOINTS.cart.clear()), () => {
    mockCart.items = [];
    mockCart.totalQuantity = 0;
    mockCart.totalPrice = toMoney("0.00");
    persistMockCart();
    return HttpResponse.json(mockCart);
  }),

  http.post(P(ENDPOINTS.cart.merge()), () => HttpResponse.json(mockCart)),
];

/* --------------------------------- orders --------------------------------- */
/* order-service WRAPS everything in the common envelope. */

const orderHandlers = [
  http.get(P(ENDPOINTS.orders.list()), ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const page = Number(url.searchParams.get("page") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 20);
    const filtered = status ? orders.filter((o) => o.status === status) : orders;
    return HttpResponse.json(
      envelope({
        content: filtered.slice(page * size, page * size + size),
        page,
        size,
        totalElements: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / size)),
      }),
    );
  }),

  http.get(P(`${ENDPOINTS.orders.list()}/:id`), ({ params }) => {
    const order = orders.find((o) => o.id === params.id);
    return order
      ? HttpResponse.json(envelope(order))
      : HttpResponse.json(
          { success: false, message: "Order not found", data: null, timestamp: new Date().toISOString() },
          { status: 404 },
        );
  }),

  http.post(P(ENDPOINTS.orders.create()), () => HttpResponse.json(envelope(orders[0]), { status: 201 })),

  http.patch(P(`${ENDPOINTS.orders.list()}/:id/cancel`), ({ params }) => {
    const order = orders.find((o) => o.id === params.id);
    if (!order) {
      return HttpResponse.json(
        { success: false, message: "Order not found", data: null, timestamp: new Date().toISOString() },
        { status: 404 },
      );
    }
    if (order.status !== "PENDING") {
      return HttpResponse.json(
        { success: false, message: "Only PENDING orders can be cancelled", data: null, timestamp: new Date().toISOString() },
        { status: 409 },
      );
    }
    return HttpResponse.json(envelope({ ...order, status: "CANCELLED" }));
  }),

  // 403 failure fixture (D6): DELETE is ADMIN-only — simulate a CUSTOMER caller.
  http.delete(P(`${ENDPOINTS.orders.list()}/:id`), () =>
    HttpResponse.json(
      { success: false, message: "Forbidden: ADMIN role required", data: null, timestamp: new Date().toISOString() },
      { status: 403 },
    ),
  ),
];

/* ------------------------- stub-backend contracts ------------------------- */
/* @stub-backend — these services are not implemented yet. Shapes are best-guess
 * expected contracts so features can be built against them. NOT in ENDPOINTS
 * because the endpoints don't exist on the real gateway yet. */

const stubHandlers = [
  // review-service (stub): product reviews summary.
  http.get(P("/api/reviews"), ({ request }) => {
    const productId = new URL(request.url).searchParams.get("productId");
    return HttpResponse.json({
      productId: Number(productId),
      average: 4.3,
      count: 128,
      items: [
        { id: 1, author: "Sam", rating: 5, comment: "Great!", createdAt: "2025-05-01T00:00:00Z" },
        { id: 2, author: "Lee", rating: 4, comment: "Good value.", createdAt: "2025-05-02T00:00:00Z" },
      ],
    });
  }),
  // inventory-service (stub): live stock check.
  http.get(P("/api/inventory/stock/:productId"), ({ params }) => {
    const product = products.find((p) => p.id === Number(params.productId));
    return HttpResponse.json({ productId: Number(params.productId), available: product?.stock ?? 0 });
  }),
];

export const handlers = [
  ...productHandlers,
  ...categoryHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...stubHandlers,
];
