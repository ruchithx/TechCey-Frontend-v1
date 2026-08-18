# E-Commerce Platform — Frontend

Angular single-page application for the **E-Commerce Microservices Platform**. It talks exclusively to the **API Gateway** (Spring Cloud Gateway) — never directly to any backend microservice — and authenticates users via **Keycloak** (OAuth2/OIDC, Authorization Code + PKCE flow).

> Core principle: the frontend has **zero knowledge of the microservice topology**. Every request goes to one base URL (the gateway). Which service actually handles it, and how many services there are, is a backend concern.

---

## Architecture

```
┌──────────────┐        HTTPS / JWT Bearer        ┌─────────────┐
│  Angular SPA │ ───────────────────────────────▶ │ API Gateway │ ──▶ backend services
└──────┬───────┘                                   └─────────────┘
       │
       │ Authorization Code + PKCE
       ▼
┌──────────────┐
│   Keycloak   │
└──────────────┘
```

- The SPA redirects to Keycloak for login; Keycloak redirects back with an authorization code.
- The OIDC client exchanges the code for an access token + refresh token (PKCE, no client secret in the browser).
- Every API call attaches `Authorization: Bearer <access_token>` and goes to the gateway's base URL — the SPA never calls `product-service`, `cart-service`, etc. directly.
- Tokens are refreshed silently before expiry; a 401 from the gateway triggers a re-login.

---

## Technology stack

| Area | Choice |
|---|---|
| Framework | Angular (standalone components) |
| Language | TypeScript |
| Auth | `angular-oauth2-oidc` (or `keycloak-angular`) — OIDC Authorization Code + PKCE |
| State management | Signals / RxJS (or NgRx if the app grows) |
| HTTP | Angular `HttpClient` with a JWT interceptor |
| Styling | Tailwind CSS (or Angular Material — pick one) |
| Forms | Angular Reactive Forms |
| Testing | Jasmine/Karma (unit), Cypress or Playwright (e2e) |
| Build | Angular CLI |
| Container | Docker (multi-stage: build → Nginx static serve) |

---

## Prerequisites

- Node.js 20+ and npm
- Angular CLI (`npm install -g @angular/cli`)
- The backend stack running locally (see `TechCey-Backend/README.md`):
  - API Gateway on `http://localhost:8085`
  - Keycloak on `http://localhost:8080`, realm `ecommerce`, client `gateway-client` (or a dedicated public client for the SPA — see note below)

> **Note:** the gateway's `gateway-client` in Keycloak may be configured as a confidential client for service-to-service use. The SPA needs its **own public client** (no client secret, PKCE enabled, valid redirect URIs pointing at `http://localhost:4200/*`). Confirm this exists in `keycloak/ecommerce-realm.json` before wiring up login — if it doesn't, it needs to be added there (not created ad-hoc in the admin console, since the realm file is re-imported on every container recreation).

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (see Configuration below)
cp src/environments/environment.example.ts src/environments/environment.ts

# 3. Run the dev server
npm start
# or: ng serve
```

App runs at `http://localhost:4200`.

**Smoke test:** log in via the Keycloak redirect, browse the product catalog, add an item to the cart, and place an order — confirming the full checkout flow end-to-end against the local backend stack.

---

## Configuration

Environment files hold the two things that change between local and deployed environments:

```ts
// src/environments/environment.ts (local)
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8085',       // API Gateway — never a service URL directly
  keycloak: {
    issuer: 'http://localhost:8080/realms/ecommerce',
    clientId: 'ecommerce-spa',               // public client, PKCE
    redirectUri: 'http://localhost:4200',
  },
};
```

```ts
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.<your-domain>',   // ALB in front of the gateway
  keycloak: {
    issuer: 'https://auth.<your-domain>/realms/ecommerce',
    clientId: 'ecommerce-spa',
    redirectUri: 'https://app.<your-domain>',
  },
};
```

No service hostnames, ports, or internal routing details ever appear in the frontend — only the gateway's public base URL.

---

## Project structure

```
src/app/
├── core/
│   ├── auth/                  # OIDC config, auth guard, token interceptor
│   ├── interceptors/          # JWT attach, error handling, retry
│   └── models/                # Shared TypeScript interfaces (Product, Order, CartItem, ...)
├── features/
│   ├── catalog/                # Product listing, search, filters, product detail
│   ├── cart/                    # Cart view, add/update/remove items
│   ├── checkout/                 # Checkout flow, order placement, order confirmation
│   ├── orders/                   # Order history, order detail, cancel
│   └── account/                   # Profile, logout
├── shared/
│   ├── components/             # Buttons, cards, loaders, pagination, etc.
│   └── pipes/                   # Currency, date formatting, etc.
└── app.routes.ts
```

---

## API integration conventions

- **Base URL:** all HTTP calls use `environment.apiBaseUrl` as the root — nothing is hardcoded per-service.
- **Response envelope:** the gateway/backend wraps responses as:
  ```json
  { "success": true, "message": "Success", "data": { ... }, "timestamp": "..." }
  ```
  A shared `ApiResponse<T>` interface and an HTTP interceptor unwrap `data` so feature code works with plain typed objects, not the envelope.
- **Auth header:** a `authInterceptor` attaches `Authorization: Bearer <token>` to every outgoing request automatically; feature services never touch tokens directly.
- **Error handling:** a shared `errorInterceptor` maps HTTP error responses to a consistent in-app notification/toast, and triggers re-login on `401`.
- **Known backend inconsistencies to route around for now** (see backend `PROJECT_STATUS.md`):
  - Product endpoints are under `/api/products` (no `/v1`), while Order endpoints are under `/api/v1/orders`. The frontend's API client should treat each feature's base path as configurable per-resource rather than assuming a single global prefix.
  - Cart is entirely client-session-scoped via Redis on the backend (`cart:{userId}`) — there is no cart persistence contract beyond what `cart-service` exposes; do not assume additional cart endpoints exist yet.

---

## Testing

```bash
# Unit tests
npm test

# E2E tests (requires the backend stack running)
npm run e2e
```

Recommended coverage priorities: auth redirect/callback handling, the JWT interceptor, and the checkout flow (including the "payment failed" / stock-unavailable error paths once payment-service and inventory-service are implemented on the backend).

---

## Build & deployment

```bash
# Production build
ng build --configuration production
```

Output in `dist/` is served as static assets via Nginx.

```
Dockerfile (multi-stage):
  1. build stage  — node:20-alpine, npm ci, ng build --configuration production
  2. runtime stage — nginx:alpine, serve dist/, SPA fallback to index.html
```

On AWS, the built static assets are served the same way the backend describes its own deployment model: same artifact everywhere, only configuration (the `apiBaseUrl` / Keycloak issuer at build time, or via a runtime-injected `env.js`) changes between environments.

---

## Non-functional targets

- First contentful paint < 2 s on a typical broadband connection
- Lighthouse performance score ≥ 90 for the catalog and product-detail pages
- Graceful degradation when the gateway or a downstream service is unavailable (skeleton states, retry, clear error messaging — not a blank screen)
- Accessible forms and navigation (WCAG AA as a baseline target)

---

## Related documentation

- Backend architecture, service responsibilities, and the checkout Saga: `TechCey-Backend/README.md`
- Current backend build status and known gaps: `TechCey-Backend/PROJECT_STATUS.md`