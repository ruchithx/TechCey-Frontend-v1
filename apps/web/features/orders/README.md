# feature: orders

Owns order history and order detail.

- **Routes:** `/orders`, `/orders/:id` (**auth-guarded**, MainLayout).
- **Backend:** order-service `/api/v1/orders` (`ENDPOINTS.orders.*`). Envelope-wrapped + `PagedResponse`
  (normalise via `normalisePage` → `Page<T>`). List params: `status, page, size`.
- `PATCH …/cancel` only succeeds when status is `PENDING`; `DELETE …` is ADMIN-only (403 for CUSTOMER).
- Virtualize long history lists (perf rule).
- Public surface: import only from `@/features/orders`.
