# feature: checkout

Owns the checkout flow (shipping address → place order).

- **Route:** `/checkout` (**auth-guarded**, MainLayout). Wrapped in `<AuthGuard>` at the app route.
- **Backend:** order-service `POST /api/v1/orders` (`ENDPOINTS.orders.create()`). Envelope-wrapped.
- Mirror the `CreateOrderRequest` DTO with a **Zod** schema (React Hook Form) once forms land.
- `ShippingAddress.country` defaults to `DEFAULT_COUNTRY` from `@/core/config/constants`.
- This is the **highest-value journey** — the target for the Playwright E2E in a later task.
- Public surface: import only from `@/features/checkout`.
