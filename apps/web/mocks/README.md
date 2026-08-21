# mocks — MSW mock backend (D6)

Four backend services are stubs and the gateway has no routes yet, so the app runs
against Mock Service Worker in development.

## Files
- `handlers.ts` — request handlers for every endpoint in `core/api/endpoints.ts`, plus `@stub-backend`
  contracts (reviews, inventory) and deliberate failure fixtures.
- `fixtures.ts` — 32 products / 6 categories, a populated cart, orders across all five statuses.
- `browser.ts` — `setupWorker(...handlers)`.
- `start.ts` — `startMocks()`, gated by `NEXT_PUBLIC_ENABLE_MSW`; throws if enabled in a prod build.

## Toggle
Set `NEXT_PUBLIC_ENABLE_MSW=true|false` (default true in dev, false in prod). Started from
`app/providers.tsx` before the app renders.

## Failure fixtures (for testing states)
| Trigger | Result |
|---|---|
| `GET /api/products?keyword=__error__` | 500 |
| `GET /api/products?keyword=__slow__` | 3 s delay (loading states) |
| `POST /api/cart/items` with qty > stock | 409 `INSUFFICIENT_STOCK` |
| `DELETE /api/v1/orders/:id` | 403 (ADMIN-only) |

This file is exempt from the "no URL literals" convention: MSW needs `:param` patterns that
`ENDPOINTS` can't express, and patterns are still derived from `ENDPOINTS` where possible.
