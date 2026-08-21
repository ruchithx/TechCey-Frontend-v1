# feature: cart

Owns the cart page and cart mutations.

- **Route:** `/cart` (public, MainLayout).
- **Backend:** cart-service (`/api/cart`, `/api/cart/items`, `/api/cart/merge`) via gateway. Bare payloads.
  Adding beyond stock returns **409** → mapped to `AppError.code === 'INSUFFICIENT_STOCK'`; show it inline.
- **Guest→user merge:** subscribe to the auth seam `onLoginSuccess((user) => …)` from `@/core/auth` and
  call `POST /api/cart/merge` (`ENDPOINTS.cart.merge()`). The seam is wired; the merge logic is yours.
- **Optimistic updates** with rollback for add/update/remove (latency is user-visible).
- Fill the header's `cart-badge` slot with the item count.
- Public surface: import only from `@/features/cart`.
