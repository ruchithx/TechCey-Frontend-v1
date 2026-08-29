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
  addresses as addressFixtures,
  availabilityByProductId,
  cart,
  categories,
  currentUser,
  customerAccount,
  notifications as notificationFixtures,
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

/** notification-service uses a slim envelope: { success, data } — no message/timestamp. */
function slimEnvelope<T>(data: T) {
  return { success: true, data };
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
/* notification-service uses the SLIM envelope { success, data } (no timestamp),
 * and returns a Spring `Page` where the current page index is `number`. */

const inbox = notificationFixtures.map((n) => ({ ...n }));

const notificationHandlers = [
  http.get(P(ENDPOINTS.notifications.list()), ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 20);
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";
    const filtered = unreadOnly ? inbox.filter((n) => !n.readAt) : inbox;
    return HttpResponse.json(
      slimEnvelope({
        content: filtered.slice(page * size, page * size + size),
        number: page,
        size,
        totalElements: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / size)),
        first: page === 0,
        last: (page + 1) * size >= filtered.length,
      }),
    );
  }),

  http.get(P(ENDPOINTS.notifications.unreadCount()), () =>
    HttpResponse.json(slimEnvelope({ unreadCount: inbox.filter((n) => !n.readAt).length })),
  ),

  http.patch(P(`${ENDPOINTS.notifications.list()}/:id/read`), ({ params }) => {
    const n = inbox.find((x) => x.id === params.id);
    if (n && !n.readAt) n.readAt = new Date().toISOString();
    return new HttpResponse(null, { status: 200 });
  }),

  http.patch(P(ENDPOINTS.notifications.markAllRead()), () => {
    const now = new Date().toISOString();
    for (const n of inbox) if (!n.readAt) n.readAt = now;
    return new HttpResponse(null, { status: 200 });
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

/* ----------------------------- current customer ---------------------------- */
/* user-service WRAPS everything in the common envelope; errors are RFC 9457.
 * `/api/v1/customers/me` is the richer view (identity + phone/locale/default +
 * address book). Per-session mutable copies so writes show on the next read. */

const account = { ...customerAccount };
const addressBook = addressFixtures.map((a) => ({ ...a }));

function syncDefault() {
  for (const a of addressBook) a.isDefault = a.id === account.defaultAddressId;
}

const customerHandlers = [
  http.get(P(ENDPOINTS.customers.me()), () => HttpResponse.json(envelope(account))),

  http.put(P(ENDPOINTS.customers.me()), async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Partial<{
      firstName: string;
      lastName: string;
      phoneNumber: string;
      preferredLocale: string;
      defaultAddressId: string;
    }>;

    if (Object.keys(body).length === 0) {
      return HttpResponse.json(
        { type: "about:blank", title: "Bad Request", status: 400, detail: "Provide at least one field" },
        { status: 400, headers: { "Content-Type": "application/problem+json" } },
      );
    }
    if (body.firstName === "__error__") {
      return HttpResponse.json(
        { type: "about:blank", title: "Identity Provider Unavailable", status: 503, detail: "The identity provider could not be reached" },
        { status: 503, headers: { "Content-Type": "application/problem+json" } },
      );
    }
    if (
      body.defaultAddressId !== undefined &&
      !addressBook.some((a) => a.id === body.defaultAddressId)
    ) {
      return HttpResponse.json(
        { type: "about:blank", title: "Bad Request", status: 400, detail: "defaultAddressId is not one of your saved addresses" },
        { status: 400, headers: { "Content-Type": "application/problem+json" } },
      );
    }

    if (body.firstName !== undefined) account.firstName = body.firstName || null;
    if (body.lastName !== undefined) account.lastName = body.lastName || null;
    if (body.phoneNumber !== undefined) account.phoneNumber = body.phoneNumber || null;
    if (body.preferredLocale !== undefined) account.preferredLocale = body.preferredLocale || null;
    if (body.defaultAddressId !== undefined) {
      account.defaultAddressId = body.defaultAddressId;
      syncDefault();
    }
    return HttpResponse.json(envelope(account, "Profile updated"));
  }),

  http.get(P(ENDPOINTS.customers.addresses()), () => HttpResponse.json(envelope(addressBook))),

  http.post(P(ENDPOINTS.customers.addresses()), async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const now = new Date().toISOString();
    const created = {
      id: `aaaaaaa1-0000-0000-0000-${String(Date.now()).slice(-12).padStart(12, "0")}`,
      label: (body.label as string) ?? null,
      line1: (body.line1 as string) ?? "",
      line2: (body.line2 as string) ?? null,
      city: (body.city as string) ?? "",
      state: (body.state as string) ?? "",
      zip: (body.zip as string) ?? "",
      country: (body.country as string) ?? "US",
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };
    addressBook.push(created);
    if (body.makeDefault === true || addressBook.length === 1) {
      account.defaultAddressId = created.id;
      syncDefault();
    }
    return HttpResponse.json(envelope(created, "Created"), { status: 201 });
  }),

  http.put(P(`${ENDPOINTS.customers.addresses()}/:id`), async ({ params, request }) => {
    const existing = addressBook.find((a) => a.id === params.id);
    if (!existing) {
      return HttpResponse.json(
        { type: "about:blank", title: "Not Found", status: 404, detail: "No address with that id" },
        { status: 404, headers: { "Content-Type": "application/problem+json" } },
      );
    }
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    existing.label = (body.label as string) ?? null;
    existing.line1 = (body.line1 as string) ?? existing.line1;
    existing.line2 = (body.line2 as string) ?? null;
    existing.city = (body.city as string) ?? existing.city;
    existing.state = (body.state as string) ?? existing.state;
    existing.zip = (body.zip as string) ?? existing.zip;
    existing.country = (body.country as string) ?? existing.country;
    existing.updatedAt = new Date().toISOString();
    if (body.makeDefault === true) {
      account.defaultAddressId = existing.id;
      syncDefault();
    }
    return HttpResponse.json(envelope(existing, "Address updated"));
  }),

  http.delete(P(`${ENDPOINTS.customers.addresses()}/:id`), ({ params }) => {
    const idx = addressBook.findIndex((a) => a.id === params.id);
    if (idx === -1) {
      return HttpResponse.json(
        { type: "about:blank", title: "Not Found", status: 404, detail: "No address with that id" },
        { status: 404, headers: { "Content-Type": "application/problem+json" } },
      );
    }
    const [removed] = addressBook.splice(idx, 1);
    if (removed && account.defaultAddressId === removed.id) {
      account.defaultAddressId = null;
      syncDefault();
    }
    return HttpResponse.json(envelope(null, "No Content"));
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
  ...customerHandlers,
];
