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
import {
  availabilityByProductId,
  cart,
  categories,
  currentUser,
  orders,
  products,
  reviews,
  reviewSummaryFor,
} from "@/mocks/fixtures";

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
    if (categoryId) filtered = filtered.filter((p) => p.category.id === Number(categoryId));

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
];

/* ---------------------------------- cart ---------------------------------- */

const cartHandlers = [
  http.get(P(ENDPOINTS.cart.get()), () => HttpResponse.json(cart)),

  http.post(P(ENDPOINTS.cart.addItem()), async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      productId?: number;
      quantity?: number;
    };
    const product = products.find((p) => p.id === body.productId);
    const quantity = body.quantity ?? 1;
    // 409 insufficient-stock failure fixture (D6) — a user-facing outcome.
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
    return HttpResponse.json(cart);
  }),

  http.put(P(`${ENDPOINTS.cart.addItem()}/:productId`), () => HttpResponse.json(cart)),
  http.delete(P(`${ENDPOINTS.cart.addItem()}/:productId`), () => HttpResponse.json(cart)),
  http.delete(P(ENDPOINTS.cart.clear()), () =>
    HttpResponse.json({ ...cart, items: [], totalQuantity: 0, totalPrice: "0.00" }),
  ),
  http.post(P(ENDPOINTS.cart.merge()), () => HttpResponse.json(cart)),
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

/* -------------------------------- inventory -------------------------------- */
/* inventory-service WRAPS everything in the common envelope. */

const inventoryHandlers = [
  http.get(P(ENDPOINTS.inventory.batch()), ({ request }) => {
    const ids = (new URL(request.url).searchParams.get("productIds") ?? "")
      .split(",")
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    const data = ids.map(
      (id) =>
        availabilityByProductId[id] ?? { productId: id, quantityAvailable: 0, inStock: false, lowStock: true },
    );
    return HttpResponse.json(envelope(data));
  }),

  http.get(P(ENDPOINTS.inventory.byProductId(0)).replace(/\/0$/, "/:productId"), ({ params }) => {
    const productId = Number(params.productId);
    const availability = availabilityByProductId[productId];
    if (!availability) {
      return HttpResponse.json(
        { success: false, message: "No inventory record", data: null, timestamp: new Date().toISOString() },
        { status: 404 },
      );
    }
    return HttpResponse.json(envelope(availability));
  }),
];

/* --------------------------------- reviews ---------------------------------- */
/* review-service returns BARE payloads — no envelope. */

const reviewHandlers = [
  http.get(P(ENDPOINTS.reviews.summary()), ({ request }) => {
    const productId = Number(new URL(request.url).searchParams.get("productId"));
    return HttpResponse.json(reviewSummaryFor(productId));
  }),

  http.get(P(ENDPOINTS.reviews.list()), ({ request }) => {
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");
    const page = Number(url.searchParams.get("page") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 20);
    const filtered = productId ? reviews.filter((r) => r.productId === Number(productId)) : reviews;
    return HttpResponse.json({
      content: filtered.slice(page * size, page * size + size),
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / size)),
      last: (page + 1) * size >= filtered.length,
    });
  }),

  http.post(P(ENDPOINTS.reviews.list()), async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      productId?: number;
      rating?: number;
      title?: string;
      comment?: string;
    };
    const created = {
      id: reviews.length + 1,
      productId: body.productId ?? 0,
      userId: "11111111-1111-1111-1111-111111111111",
      rating: body.rating ?? 5,
      title: body.title ?? null,
      comment: body.comment ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(created, { status: 201 });
  }),
];

/* ----------------------------- notifications -------------------------------- */
/* notification-service WRAPS everything in the common envelope. */

const notificationHandlers = [
  http.get(P(ENDPOINTS.notifications.list()), ({ request }) => {
    const page = Number(new URL(request.url).searchParams.get("page") ?? 0);
    const size = Number(new URL(request.url).searchParams.get("size") ?? 20);
    return HttpResponse.json(
      envelope({ content: [], page, size, totalElements: 0, totalPages: 1, last: true }),
    );
  }),
];

/* ------------------------------- current user ------------------------------- */
/* user-service WRAPS everything in the common envelope; errors are RFC 9457. */

// A per-session mutable copy so PATCH changes are visible on the next GET.
const me = { ...currentUser };

const userHandlers = [
  http.get(P(ENDPOINTS.users.me()), () => HttpResponse.json(envelope(me))),

  http.patch(P(ENDPOINTS.users.me()), async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      firstName?: string;
      lastName?: string;
    };

    if (body.firstName === undefined && body.lastName === undefined) {
      return HttpResponse.json(
        { type: "https://errors.ecommerce.com/http-error", title: "Bad Request", status: 400, detail: "Provide at least one of: firstName, lastName" },
        { status: 400, headers: { "Content-Type": "application/problem+json" } },
      );
    }

    // Deliberate failure fixtures (D6) — user-facing outcomes worth testing.
    if (body.firstName === "__error__") {
      return HttpResponse.json(
        { type: "https://errors.ecommerce.com/upstream-unavailable", title: "Identity Provider Unavailable", status: 503, detail: "The identity provider could not be reached" },
        { status: 503, headers: { "Content-Type": "application/problem+json" } },
      );
    }
    if (body.firstName === "__invalid__") {
      return HttpResponse.json(
        {
          type: "https://errors.ecommerce.com/validation",
          title: "Validation Failed",
          status: 400,
          detail: "Request body has validation errors",
          errors: [{ field: "firstName", message: "firstName must be 1..255 characters when provided" }],
        },
        { status: 400, headers: { "Content-Type": "application/problem+json" } },
      );
    }

    if (body.firstName !== undefined) me.firstName = body.firstName;
    if (body.lastName !== undefined) me.lastName = body.lastName;
    return HttpResponse.json(envelope(me, "Profile updated"));
  }),
];

export const handlers = [
  ...productHandlers,
  ...categoryHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...inventoryHandlers,
  ...reviewHandlers,
  ...notificationHandlers,
  ...userHandlers,
];
