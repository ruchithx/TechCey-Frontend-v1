# feature: catalog

Owns product browsing: home, product list, product detail, category, and search.

- **Routes:** `/`, `/products`, `/products/:id`, `/categories/:slug`, `/search` (all public, MainLayout).
- **Backend:** product-service (`/api/products`, `/api/categories`) via the gateway. Bare payloads
  (no envelope). List params: `keyword, categoryId, minPrice, maxPrice, page, size, sort`.
- **Public surface:** import only from `@/features/catalog` (this folder's `index.ts`). Deep imports are
  lint-blocked.

## Structure
```
catalog/
├── components/
│   ├── product-card.tsx   # shared product tile (+ skeleton), used by Home and (later) the list page
│   └── home/               # Home-page-only section components
├── pages/        # routed components — HomePage is built; List/Detail/Category/Search still placeholders
├── services/     # data access hooks — use<Domain><Action>, wrap useQuery/useMutation
├── models/       # feature-local types (none needed yet — DTOs from core/api/types.ts suffice)
├── catalog.routes.ts
└── index.ts
```

## Status
- **Home (`/`)** — built: hero, value props, category nav, featured products, CTA banner. Uses
  `useCategories` / `useProductList` (`services/`).
- **Product Listing, Product Detail, Category, Search** — still `FeaturePlaceholder` stubs.

## Notes for whoever builds the rest
- `CategoryResponse` has no `slug` field yet (only `id`/`name`/`description`), so Home's category tiles
  link to `/products?categoryId=<id>` rather than `/categories/:slug`. Revisit once the backend exposes a
  slug, or the `CategoryPage` route needs to resolve slug → id itself.
- Filters/pagination live in the **URL** (searchParams), not component state.
- Prices render with `formatMoney` and the `.font-tabular` class.
