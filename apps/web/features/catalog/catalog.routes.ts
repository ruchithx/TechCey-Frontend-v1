/**
 * Route ownership manifest for the catalog feature. Next.js uses file-based
 * routing (app/ segments), so this is the authoritative record of which paths
 * this feature owns — the app route files are thin and delegate here.
 */
export const catalogRoutes = {
  owner: "catalog",
  paths: ["/", "/products", "/products/:id", "/categories/:slug", "/search"],
} as const;
