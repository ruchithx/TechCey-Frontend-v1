/**
 * Realistically-shaped fixture data for the mock backend.
 * 32 products across 6 categories, a populated cart, and orders spanning ALL
 * five order statuses. Money is always a string (NUMERIC in the DB).
 */

import type {
  CartResponse,
  CategoryResponse,
  OrderResponse,
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
        categoryId: category.id,
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
      categoryId: 1,
      createdAt: "2025-03-01T09:00:00Z",
      updatedAt: "2025-03-01T09:00:00Z",
    });
    id++;
  }
  return out;
})();

const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

export const cart: CartResponse = {
  userId: MOCK_USER_ID,
  items: [
    {
      productId: 1,
      productName: products[0]!.name,
      imageUrl: products[0]!.imageUrl,
      unitPrice: products[0]!.price,
      quantity: 1,
      subtotal: products[0]!.price,
    },
    {
      productId: 6,
      productName: products[5]!.name,
      imageUrl: products[5]!.imageUrl,
      unitPrice: products[5]!.price,
      quantity: 2,
      subtotal: money(Number(products[5]!.price) * 2),
    },
  ],
  totalAmount: money(Number(products[0]!.price) + Number(products[5]!.price) * 2),
  itemCount: 3,
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
    userId: MOCK_USER_ID,
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

export { MOCK_USER_ID };
