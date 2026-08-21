export const ordersRoutes = {
  owner: "orders",
  paths: ["/orders", "/orders/:id"],
  guard: "auth",
} as const;
