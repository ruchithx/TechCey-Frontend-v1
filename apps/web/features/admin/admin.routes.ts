export const adminRoutes = {
  owner: "admin",
  paths: ["/admin/products", "/admin/categories"],
  guard: "role:ADMIN",
} as const;
