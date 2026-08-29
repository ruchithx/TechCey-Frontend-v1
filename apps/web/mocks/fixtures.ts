/**
 * Realistically-shaped fixture data for the mock backend.
 * 32 products across 6 categories, a populated cart, and orders spanning ALL
 * five order statuses. Money is always a string (NUMERIC in the DB).
 */

import type {
  AddressResponse,
  AvailabilityResponse,
  CartResponse,
  CategoryResponse,
  CurrentUserResponse,
  CustomerAccountResponse,
  NotificationResponse,
  OrderResponse,
  ReviewResponse,
  ReviewSummaryResponse,
  ProductResponse,
} from "@/core/api/types";
import { toMoney, type Money } from "@/core/api/money";

export const categories: CategoryResponse[] = [
  { id: 1, name: "Laptops", description: "Notebooks and ultrabooks" },
  { id: 2, name: "Phones", description: "Smartphones and accessories" },
  { id: 3, name: "Audio", description: "Headphones, earbuds, speakers" },
  { id: 4, name: "Peripherals", description: "Keyboards, mice, docks" },
  { id: 5, name: "Displays", description: "Monitors and screens" },
  { id: 6, name: "Wearables", description: "Watches and trackers" },
];

const NAMES: Record<number, string[]> = {
  1: ["Aero 14 Ultrabook", "ProBook X1", "Nimbus Slim", "Forge Gaming 16", "Zenith Air"],
  2: ["Pulse 5G", "Halo Mini", "Vertex Pro", "Echo Lite", "Nova Max"],
  3: ["Cloud ANC Headphones", "Drift Earbuds", "Boom Speaker", "Studio Monitors", "Tone Buds"],
  4: ["Tactile Mech Keyboard", "Glide Wireless Mouse", "Hub Dock 11-in-1", "Palm Trackpad", "Key65"],
  5: ["Vista 27 4K", "UltraWide 34", "Pixel 24 QHD", "Studio 32 Pro", "Flat 27"],
  6: ["Trace Watch 2", "Band Fit", "Chrono GPS", "Pace Ring", "Loop SE"],
};

function money(n: number): Money {
  return toMoney(n.toFixed(2));
}

/** Deterministic 32-product catalog. */
export const products: ProductResponse[] = (() => {
  const out: ProductResponse[] = [];
  let id = 1;
  for (const category of categories) {
    const names = NAMES[category.id] ?? [];
    for (let i = 0; i < names.length; i++) {
      const base = 40 + ((id * 37) % 1600);
      out.push({
        id,
        name: names[i]!,
        description: `${names[i]} — a solid pick in ${category.name.toLowerCase()}.`,
        price: money(base + 0.99),
        imageUrl: id % 5 === 0 ? null : `https://picsum.photos/seed/techcey-${id}/600/600`,
        stock: (id * 7) % 25, // some zero-stock items for empty-state testing
        category,
        createdAt: "2025-01-10T09:00:00Z",
        updatedAt: "2025-02-01T09:00:00Z",
      });
      id++;
    }
  }
  // top up past 30 with a couple more laptops
  for (let i = 0; out.length < 32; i++) {
    out.push({
      id: id,
      name: `Aero 14 Ultrabook (Rev ${i + 2})`,
      description: "Refreshed model.",
      price: money(1099 + i),
      imageUrl: `https://picsum.photos/seed/techcey-${id}/600/600`,
      stock: 12,
      category: categories[0]!,
      createdAt: "2025-03-01T09:00:00Z",
      updatedAt: "2025-03-01T09:00:00Z",
    });
    id++;
  }
  return out;
})();

/** Availability fixtures mirror each product's `stock`, matching inventory-service shape. */
export const availabilityByProductId: Record<number, AvailabilityResponse> = Object.fromEntries(
  products.map((p) => [
    p.id,
    {
      productId: p.id,
      quantityAvailable: p.stock,
      inStock: p.stock > 0,
      lowStock: p.stock > 0 && p.stock <= 5,
    } satisfies AvailabilityResponse,
  ]),
);

/** A handful of reviews on the first few products, for review-section UI dev. */
export const reviews: ReviewResponse[] = [
  {
    id: 1,
    productId: 1,
    userId: "11111111-1111-1111-1111-111111111111",
    rating: 5,
    title: "Excellent build quality",
    comment: "Great!",
    createdAt: "2025-05-01T00:00:00Z",
    updatedAt: "2025-05-01T00:00:00Z",
  },
  {
    id: 2,
    productId: 1,
    userId: "22222222-2222-2222-2222-222222222222",
    rating: 4,
    title: "Good value",
    comment: "Good value.",
    createdAt: "2025-05-02T00:00:00Z",
    updatedAt: "2025-05-02T00:00:00Z",
  },
];

export function reviewSummaryFor(productId: number): ReviewSummaryResponse {
  const forProduct = reviews.filter((r) => r.productId === productId);
  const totalReviews = forProduct.length;
  const averageRating = totalReviews
    ? Math.round((forProduct.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 100) / 100
    : 0;
  const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of forProduct) ratingBreakdown[r.rating] = (ratingBreakdown[r.rating] ?? 0) + 1;
  return { productId, averageRating, totalReviews, ratingBreakdown };
}

const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

export const cart: CartResponse = {
  userId: MOCK_USER_ID,
  items: [
    {
      productId: 1,
      productName: products[0]!.name,
      unitPrice: products[0]!.price,
      quantity: 1,
      lineTotal: products[0]!.price,
    },
    {
      productId: 6,
      productName: products[5]!.name,
      unitPrice: products[5]!.price,
      quantity: 2,
      lineTotal: money(Number(products[5]!.price) * 2),
    },
  ],
  totalPrice: money(Number(products[0]!.price) + Number(products[5]!.price) * 2),
  totalQuantity: 3,
};

export const orders: OrderResponse[] = [
  makeOrder("PENDING", 1),
  makeOrder("CONFIRMED", 2),
  makeOrder("PAID", 3),
  makeOrder("CANCELLED", 4),
  makeOrder("FAILED", 5),
];

function makeOrder(status: OrderResponse["status"], seq: number): OrderResponse {
  const product = products[seq]!;
  const qty = 1 + (seq % 3);
  const subtotal = money(Number(product.price) * qty);
  return {
    id: `00000000-0000-0000-0000-00000000000${seq}`,
    orderNumber: `ORD-17070000${seq}0-A${seq}B${seq}C${seq}`,
    customerId: MOCK_USER_ID,
    status,
    totalAmount: subtotal,
    shippingAddress: {
      line1: `${seq}00 Market St`,
      line2: null,
      city: "Springfield",
      state: "CA",
      zip: "90210",
      country: "US",
    },
    notes: seq % 2 === 0 ? "Leave at the door." : null,
    items: [
      {
        id: `10000000-0000-0000-0000-00000000000${seq}`,
        productId: product.id,
        productName: product.name,
        productSku: `SKU-${product.id}`,
        unitPrice: product.price,
        quantity: qty,
        subtotal,
      },
    ],
    createdAt: "2025-04-01T12:00:00Z",
    updatedAt: "2025-04-02T12:00:00Z",
  };
}

/** The signed-in customer's own profile — mirrors user-service `CurrentUserResponse`. */
export const currentUser: CurrentUserResponse = {
  id: MOCK_USER_ID,
  username: "demo.customer",
  email: "demo.customer@example.com",
  emailVerified: true,
  firstName: "Demo",
  lastName: "Customer",
  enabled: true,
  roles: ["CUSTOMER"],
};

/** Saved-address book — mirrors user-service `AddressResponse`, oldest first. */
export const addresses: AddressResponse[] = [
  {
    id: "aaaaaaa1-0000-0000-0000-000000000001",
    label: "Home",
    line1: "100 Market St",
    line2: "Apt 4B",
    city: "Springfield",
    state: "CA",
    zip: "90210",
    country: "US",
    isDefault: true,
    createdAt: "2025-02-01T09:00:00Z",
    updatedAt: "2025-02-01T09:00:00Z",
  },
  {
    id: "aaaaaaa1-0000-0000-0000-000000000002",
    label: "Work",
    line1: "500 Enterprise Way",
    line2: null,
    city: "Metropolis",
    state: "NY",
    zip: "10001",
    country: "US",
    isDefault: false,
    createdAt: "2025-03-15T09:00:00Z",
    updatedAt: "2025-03-15T09:00:00Z",
  },
];

/**
 * The signed-in customer's account — mirrors user-service `CustomerAccountResponse`
 * (`GET /api/v1/customers/me`): the Keycloak identity block plus the
 * backend-owned phone / locale / defaultAddressId.
 */
export const customerAccount: CustomerAccountResponse = {
  ...currentUser,
  phoneNumber: "+1 555 010 2003",
  preferredLocale: "en-US",
  defaultAddressId: addresses[0]!.id,
};

/** A few IN_APP notifications — mirrors notification-service list items (bodyPreview set, body null). */
export const notifications: NotificationResponse[] = [
  {
    id: "bbbbbbb1-0000-0000-0000-000000000001",
    channel: "IN_APP",
    templateCode: "ORDER_CONFIRMATION",
    subject: "Your order ORD-170700010 is confirmed",
    bodyPreview: "Thanks! We're getting your order ready for dispatch.",
    body: null,
    recipient: "d***@example.com",
    status: "SENT",
    referenceType: "ORDER",
    referenceId: "00000000-0000-0000-0000-000000000001",
    readAt: null,
    sentAt: "2025-04-01T12:05:00Z",
    createdAt: "2025-04-01T12:05:00Z",
  },
  {
    id: "bbbbbbb1-0000-0000-0000-000000000002",
    channel: "IN_APP",
    templateCode: "SHIPMENT_UPDATE",
    subject: "Your order has shipped",
    bodyPreview: "Track your parcel from the orders page.",
    body: null,
    recipient: "d***@example.com",
    status: "SENT",
    referenceType: "ORDER",
    referenceId: "00000000-0000-0000-0000-000000000003",
    readAt: "2025-04-03T08:00:00Z",
    sentAt: "2025-04-02T18:00:00Z",
    createdAt: "2025-04-02T18:00:00Z",
  },
];

export { MOCK_USER_ID };
