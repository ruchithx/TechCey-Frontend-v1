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
├── components/   # private catalog UI (add here)
├── pages/        # routed components (currently placeholders)
├── services/     # data access hooks — use<Domain><Action>, wrap useQuery/useMutation
├── models/       # feature-local types
├── catalog.routes.ts
└── index.ts
```

## To build next
- `services/useProductList.ts`, `services/useProductDetail.ts`, `services/useCategories.ts` — wrap
  TanStack Query, use `queryKeys.products.*`, fetch via `request()` + `ENDPOINTS`.
- Filters/pagination live in the **URL** (searchParams), not component state.
- Prices render with `formatMoney` and the `.font-tabular` class.
