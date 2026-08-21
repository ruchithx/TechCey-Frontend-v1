# Claude Code Task — TechCey Frontend Foundation (React / Next.js / Turborepo)

> Paste this whole file as your first message to Claude Code, run from the repo root
> (`TechCey-Frontend/`). This supersedes any earlier Angular-oriented brief — this repo
> is confirmed **React 19 + Next.js 16 App Router**, a **Turborepo** monorepo with **pnpm**
> workspaces, **not** a single Angular SPA.

---

## 0. How to work on this task

1. **Read first, in this order:** `CLAUDE.md`, `Frontend-developer-guide.md`, root `package.json`, `turbo.json`, `pnpm-workspace.yaml`, `packages/ui/components.json`, `packages/ui/package.json`, `apps/web/package.json`, `apps/admin/package.json`, and the existing `packages/ui/src/` tree. Summarize what you found in under 15 lines, then state your plan before writing code.
2. **`CLAUDE.md` is authoritative.** If anything below conflicts with it, tell me the conflict and stop — don't silently pick one.
3. **Extend, don't duplicate.** `Frontend-developer-guide.md` already exists at root. Extend it. Do not create a second `FRONTEND_DEVELOPER_GUIDE.md`.
4. Work in order: **D0 (cleanup) → D1 (tokens) → D2 (component library) → D3 (layouts) → D4 (API/HTTP layer) → D5 (auth) → D6 (routes) → D7 (boundaries) → D8 (MSW) → D9 (testing) → D10 (showcase) → D11 (docs).** Each deliverable must pass `pnpm build && pnpm lint && pnpm check-types` before you move to the next.
5. Commit after each deliverable with a conventional-commit message.
6. Where I've given an exact type, path, or name, use it verbatim. Where I've left something open, make the call, state it in one line, and move on — don't ask me about small things.
7. Do not write real feature logic. See §6 for hard prohibitions.

---

## 1. Project context

### Product

**TechCey** — an e-commerce platform. Backend is a separate Spring Boot microservices monorepo, reached through a single API Gateway. This repo is the frontend: **two separate Next.js apps**, not one SPA — `apps/web` (customer storefront) and `apps/admin` (admin console). Roles are `CUSTOMER` and `ADMIN` via Keycloak.

Customer journey: browse catalog → filter/search → product detail → cart → authenticate → checkout with shipping address → order placed → order history. Admin: product and category CRUD.

### Backend services (real current state)

| Service | Status | Base path (via gateway) |
|---|---|---|
| API Gateway | Auth filter done, **routes not yet configured** | — |
| product-service | Complete | `/api/products`, `/api/categories` |
| cart-service | Complete | `/api/cart` |
| order-service | Complete (reference impl) | `/api/v1/orders` |
| payment-service | Stub | — |
| inventory-service | Stub | — |
| notification-service | Stub | — |
| review-service | Stub | — |

**Both apps talk only to the gateway**, one base URL, never a service port directly.

### Two backend inconsistencies to design around (don't work around ad hoc — isolate them)

1. **Path prefixes disagree**: product/cart use `/api/...`, order uses `/api/v1/...`. Will be standardized later — must be a one-file change when it happens.
2. **Response envelopes disagree**: order-service wraps everything as `{ success, message, data, timestamp }`; product/cart return bare payloads with their own error shape. The HTTP layer must unwrap transparently so no page or component ever sees the envelope.

### Auth model

- Keycloak at `http://localhost:8080`, realm `ecommerce`. Roles `ADMIN`/`CUSTOMER` at `realm_access.roles[]`. User id is JWT `sub`.
- **Access token lifespan 900s** — silent renew is mandatory.
- Gateway strips and re-injects `X-User-Id`/`X-User-Roles` from verified claims. **Never send those headers yourself** — send only `Authorization: Bearer <token>`.

⚠️ **Flag, don't fix:** the realm's `gateway-client` may be confidential/bearer-only. A browser app needs a **public client with PKCE**, with `http://localhost:3000` and `http://localhost:3001` (and prod origins later) registered as redirect URIs / web origins in `keycloak/ecommerce-realm.json`. That file lives in the *backend* repo — **do not touch it**. Surface this as a blocker in your final report.

### Exact data contracts

```ts
// product-service
interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  price: string;            // NUMERIC(12,2) as string — see money rule in D4
  imageUrl: string | null;  // nullable, every image needs a fallback
  stock: number;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}
interface CategoryResponse { id: number; name: string; description: string | null; }
// list params: keyword, categoryId, minPrice, maxPrice, page (default 0), size (default 20), sort

// cart-service
interface CartItemResponse {
  productId: number; productName: string; imageUrl: string | null;
  unitPrice: string; quantity: number; subtotal: string;
}
interface CartResponse {
  userId: string; items: CartItemResponse[]; totalAmount: string; itemCount: number;
}
// Exceeding stock returns HTTP 409 — expected, user-facing, not a crash.

// order-service
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'FAILED';
interface ShippingAddress {
  line1: string; line2: string | null; city: string; state: string; zip: string; country: string;
}
interface OrderItemResponse {
  productId: number; productName: string; productSku: string;
  unitPrice: string; quantity: number; subtotal: string;
}
interface OrderResponse {
  id: string; orderNumber: string; userId: string; status: OrderStatus;
  totalAmount: string; shippingAddress: ShippingAddress; notes: string | null;
  items: OrderItemResponse[]; createdAt: string; updatedAt: string;
}
// order list params: status, page (default 0), size (default 20)
// DELETE /api/v1/orders/{id} — ADMIN only. PATCH .../cancel — only when PENDING.
```

Confirm the real `Page`/`PagedResponse` shape against each service's `/api-docs` where reachable; otherwise flag as unverified.

### Team context

Three developers, all on Claude Code. After this task, features get split by folder ownership — one dev on catalog, one on cart/checkout/orders, admin picked up by whoever's free. Everything you build here is infrastructure the other two will build on without asking questions, so favor explicit, boring, well-documented code over clever abstraction.

---

## 2. Confirmed stack — do not deviate without asking

```
Monorepo:        Turborepo + pnpm workspaces (already set up)
Framework:       Next.js 16 (App Router), React 19, TypeScript 5.9 strict
Styling:         Tailwind CSS v4 — CSS-first (@theme in CSS, NOT tailwind.config tokens)
Components:      shadcn/ui, already initialized in packages/ui (style "new-york", baseColor "neutral")
Server state:    TanStack Query v5 (provider already wired in both apps)
Auth:            react-oidc-context + oidc-client-ts (NOT installed yet — this task installs it)
Forms:           react-hook-form + zod (NOT installed yet)
Mocking:         MSW (NOT installed yet)
Type generation: openapi-typescript (NOT installed yet)
Testing:         Vitest + React Testing Library + Playwright (NOT installed yet)
Boundary lint:   eslint-plugin-boundaries or no-restricted-imports (NOT installed yet)
```

Note: `packages/eslint-config` uses `eslint-plugin-only-warn`, which downgrades all ESLint errors to warnings. Apps then run `eslint --max-warnings 0`, so warnings still fail CI — new boundary rules will surface as warnings but must still break the build. Verify this actually happens.

---

## 3. Scope

### In scope this task
Repo cleanup · design tokens · **the shared reusable component library in `packages/ui`** · **app shells / layouts for both apps** · HTTP + API contract layer · auth plumbing · route skeleton with placeholders · feature-boundary lint · MSW mocks · baseline testing setup · component showcase page · docs.

### Out of scope — placeholders only
Real product listing/filtering logic · product detail page content · cart page logic · checkout flow logic · order history data wiring · admin CRUD logic. Every route gets a component that renders using the real layout and real shared components, with obviously-placeholder content (e.g., a `ProductCard` grid rendered with 6 fixture items is fine for the showcase; a live data-fetching product list page is not).

---

## 4. Deliverables

### D0 — Repo cleanup (do this first, it's small)

From the known-issues list — fix all of these:

1. Delete the broken `apps/web/tailwind.config.ts` (bare fragment, no export, moot under Tailwind v4's CSS-first config). Confirm content scanning is handled via `@source` in the new `globals.css` instead.
2. Create the missing `packages/ui/src/styles/globals.css` (referenced by `package.json`'s `./globals.css` export and by `components.json`, but doesn't exist). This is where D1 tokens live.
3. Rename `apps/admin/package.json` name from `"docs"` to `"admin"`. Update every reference to the old name across `turbo.json`, root scripts, and any workspace filters (`pnpm --filter docs ...`).
4. Delete the stray `packages/ui/package-lock.json` (npm lockfile inside a pnpm workspace).
5. Remove starter cruft: `app/page.tsx` demo content and `page.module.css` raw hex colors in both apps, the unused starter SVGs in `public/` for whichever aren't reused, and confirm nothing else references the deleted `page.module.css`.
6. Leave `Frontend-developer-guide.md` in place — you'll extend it in D11, not replace it.

Verify `pnpm install && pnpm build` still succeeds after cleanup before moving on.

---

### D1 — Design tokens (`packages/ui/src/styles/globals.css`)

No Figma. This **is** the design spec. Tailwind v4 is CSS-first — define tokens as CSS custom properties and map them via `@theme`, not a JS config.

```css
@import "tailwindcss";

:root {
  --background: ...;
  --foreground: ...;
  /* ... full semantic set below ... */
}

.dark {
  --background: ...;
  /* dark overrides, if you decide dark mode is in scope */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* map every token below the same way */
}
```

Verify this exact mechanism against the installed Tailwind v4 version's docs/changelog before committing to it — v4's conventions are still settling and I'd rather you check than guess.

**Required semantic tokens:** `background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`, `success`, `success-foreground`, `warning`, `warning-foreground`, `border`, `input`, `ring`, plus a `radius` base with `sm/md/lg/xl` derived values, a type scale (`xs`→`4xl`) across a display face, a body face, and a tabular-figures face for prices/SKUs/order numbers, a 3-level shadow scale, and a named z-index scale (`dropdown`, `sticky`, `overlay`, `modal`, `toast`).

**Decisions to make and state in one line each:**
- **Dark mode: yes/no.** Decide now; retrofitting later is expensive.
- **Currency and locale.** The `orders` table defaults `shipping_country` to `'US'` — don't assume that's the real target market. **Ask me** rather than guessing, and put the values in `packages/api-client` config (D4), not scattered as literals.

**Visual direction:** avoid the generic AI-storefront defaults — warm cream + serif + terracotta; near-black + single acid accent; broadsheet hairlines. Pick a direction suited to a working storefront: legible, dense, trustworthy, fast to scan. Propose a 5–6 color named palette with hex values and a one-line rationale before writing the CSS, and wait for my go-ahead on that one item only, then proceed with everything else.

Existing `Button`, `Card`, `Dialog` in `packages/ui` must be re-verified against the new tokens — they were built before tokens existed and likely reference shadcn's untouched defaults.

---

### D2 — Reusable component library (`packages/ui`)

This is now explicitly in scope. Build on top of the existing Button/Card/Dialog using shadcn conventions (`pnpm dlx shadcn@latest add <name>` from `packages/ui` where a shadcn primitive exists; hand-build where it doesn't).

**Generic primitives** — add whatever's missing from:
`Input`, `Textarea`, `Select`, `Checkbox`, `Radio`/`RadioGroup`, `FormField` (label + error + hint wrapper for use with react-hook-form), `Label`, `Toast`/`Toaster` (+ a `useToast` hook), `Alert`, `Spinner`, `Skeleton`, `EmptyState`, `ErrorState`, `Sheet`/`Drawer`, `DropdownMenu`, `Tooltip`, `Tabs`, `Separator`, `Badge`, `Breadcrumb`, `Avatar`, `Pagination`, `DataTable` (headless, columns as props), `SearchInput` (debounced, controlled).

Mandate: every list-style UI in the app must be able to express its three states with `Skeleton`, `EmptyState`, and `ErrorState` — build all three now so nobody improvises later.

**E-commerce-specific shared components** — these are cross-feature (used by catalog, cart, checkout, orders, admin alike), so they belong here, not inside any one app's feature folder:

| Component | Notes |
|---|---|
| `PriceDisplay` | Takes the branded `Money` type from D4, never a raw `number`. Currency/locale from config. |
| `QuantityStepper` | `min`, `max` (stock-aware), controlled. Used in cart, PDP, admin order edit. |
| `RatingStars` | Read-only and interactive variants (review-service is stubbed but in scope). |
| `StatusBadge` | Variant-mapped, not ad hoc per usage. Covers the 5 fixed `OrderStatus` values and a stock-status variant. |
| `ProductCard` | Presentational only — props in, no data fetching inside it. Used on home, category pages, search, PDP "related", wishlist. |
| `AddressForm` | Matches `ShippingAddress` exactly: `line1/line2/city/state/zip/country`. Built with react-hook-form + zod. Used by checkout and account. |
| `ImageWithFallback` | `imageUrl` is nullable everywhere. |

Every component: typed props (no `any`), accepts `className` for composition, works with keyboard navigation and visible focus, and gets a one-paragraph usage comment. Export everything from a single `packages/ui/src/index.ts` (or the existing per-path exports if that's the established pattern — check `components.json` and `package.json` exports first and stay consistent).

---

### D3 — App shells / layouts

Since these are two separate Next.js apps, each gets its own shell, but both are assembled from D2 primitives — don't hand-roll header/nav markup independently in each app.

**`apps/web` (customer):**
- Root layout (`app/layout.tsx`): header with logo/home link, search-input slot (uses `SearchInput`), cart-badge slot (empty outlet — cart feature fills it later), account menu (login/logout/orders, driven by an auth hook from D5), mobile nav drawer (uses `Sheet`).
- Footer.
- A route-group layout for auth pages (`app/(auth)/layout.tsx`) that's minimal — no header/footer chrome.

**`apps/admin`:**
- Root layout: sidebar nav + content area, using `Sheet`/`Tabs`/whatever fits from D2, collapsible on mobile.
- Every admin route gated by `roleGuard`-equivalent (D5) at the layout level.

**Both:** global error boundary (`app/error.tsx`), loading UI (`app/loading.tsx`), and `Metadata`/`generateMetadata` set up per route group.

Layouts are pure composition of D2 components plus slots — no business logic, no data fetching beyond what's needed to render nav state (e.g., auth status).

---

### D4 — HTTP and API contract layer

New workspace package: **`packages/api-client`** (`@repo/api-client`), consumed by both apps. Creating a new shared package is the right call here — duplicating this logic per app is exactly the kind of drift the brief exists to prevent.

**a) `endpoints.ts`** — every backend path as a constant. No URL string literals anywhere outside this file.

```ts
const API_PREFIX = '/api';
const API_V1_PREFIX = '/api/v1'; // TODO: collapses once backend standardizes

export const ENDPOINTS = {
  products: { list: () => `${API_PREFIX}/products`, byId: (id: number) => `${API_PREFIX}/products/${id}` /* ... */ },
  categories: { /* ... */ },
  cart: { /* ... */ },
  orders: {
    list: () => `${API_V1_PREFIX}/orders`,
    byId: (id: string) => `${API_V1_PREFIX}/orders/${id}`,
    cancel: (id: string) => `${API_V1_PREFIX}/orders/${id}/cancel`,
  },
} as const;
```

**b) Envelope-unwrapping fetch wrapper.** If a response body is `{ success, message, data, timestamp }`, return `data`; otherwise return the body as-is. Cover both shapes with unit tests (D9).

**c) Normalized error type**, produced from every failure path:

```ts
interface AppError {
  status: number;       // 0 = network failure
  code: string;         // e.g. 'INSUFFICIENT_STOCK'
  message: string;      // safe to show a user
  fieldErrors?: Record<string, string>;
  raw?: unknown;        // dev-mode only
}
```
Map `400`→validation, `401`→unauthenticated (see D5), `403`→forbidden, `404`→not found, `409`→conflict (**give the stock case its own code**), `5xx`→server error, `0`→offline.

**d) Money as a branded string type, never `number`.** Backend money is `NUMERIC` serialized as string; parsing to JS `number` risks real rounding bugs on prices. Provide `Money`, `formatMoney(value, currency, locale)`, `sumMoney(...)` using integer-cent arithmetic. `currency`/`locale` come from a `packages/api-client/src/config.ts` (or a dedicated `packages/config`) — not scattered literals.

**e) Typed DTOs** — generate with `openapi-typescript` against each service's `/api-docs` where reachable; add a root `api:types` script. Where unreachable, hand-write from §1 with a `TODO(openapi)` marker.

**f) One normalized `Page<T>`** — reconcile product-service's `PageResponse` and order-service's `PagedResponse` into a single frontend type inside this layer.

**g) TanStack Query setup** — confirm the existing provider in both apps' `providers.tsx`, centralize `queryClient` defaults (staleTime, no-retry-on-4xx) in `packages/api-client`, and document the query-key convention (`['products','list',filters]`, `['cart']`, `['orders','list',filters]`, etc.) with examples in the package README.

---

### D5 — Auth

New workspace package: **`packages/auth`** (`@repo/auth`), used by both apps (same Keycloak realm, same roles).

1. `react-oidc-context` provider configured for Authorization Code + PKCE against realm `ecommerce`. Issuer, client id, redirect URI, scopes all from env — zero hardcoded values, and redirect URIs differ per app (3000 vs 3001).
2. Silent renew configured given the 15-minute token lifespan.
3. `fetch`/HTTP interceptor equivalent that attaches `Authorization: Bearer <token>` to gateway requests only — never to third-party URLs.
4. Hooks: `useAuth()` exposing `isAuthenticated`, `currentUser` (`{ id, username, email, roles }` decoded from the token), `hasRole(role)`, `login()`, `logout()`.
5. Route protection for the App Router: middleware or layout-level guards for authenticated routes (`/checkout`, `/orders`, `/account` in web) and role-gated routes (all of `apps/admin`).
6. **401 handling**: attempt one silent renew; on failure, clear session and redirect to login preserving the return path.
7. **Guest-cart-merge hook point** for `POST /api/cart/merge`: expose an `onLoginSuccess` callback the cart feature can subscribe to later. Do not implement the merge logic itself — that's the cart feature owner's job. Document the seam.

---

### D6 — Route skeleton (placeholders)

Each route below is a real page using the real layout (D3) and, where natural, real D2 components with fixture data — not a bare "TODO" string. This is what gives the other two developers something to build inside rather than starting from a blank file.

**`apps/web`:**

| Route | Notes |
|---|---|
| `/` | Home — hero slot + a `ProductCard` grid with 6 fixture items |
| `/products` | Placeholder list using `ProductCard` grid + `Pagination` |
| `/products/[id]` | Placeholder PDP layout |
| `/categories/[slug]` | Placeholder |
| `/search` | Placeholder with `SearchInput` wired to nothing yet |
| `/cart` | Placeholder using `EmptyState` |
| `/(auth)/checkout` | Auth-gated placeholder |
| `/(auth)/orders`, `/(auth)/orders/[id]` | Auth-gated placeholder using `StatusBadge` |
| `/(auth)/account` | Auth-gated placeholder |
| `/login`, `/callback` | **Implement for real** — this is D5's actual auth flow |
| `/dev/ui` | D10 |

**`apps/admin`:**

| Route | Notes |
|---|---|
| `/products` | Role-gated placeholder using `DataTable` |
| `/categories` | Role-gated placeholder |
| `/login`, `/callback` | Real auth flow, same as web |

---

### D7 — Feature boundary enforcement

Add a fixed feature folder shape inside each app (features are per-app, not shared — catalog/cart/checkout/orders/account live in `apps/web/features/*`; admin's live in `apps/admin/features/*`):

```
features/<domain>/
├── components/   # private to this feature
├── hooks/
├── services/
├── models/
└── index.ts      # only public surface
```

Add lint rules (via `packages/eslint-config`, extended by both apps) that **fail the build**, not just warn past `--max-warnings 0`:

1. No cross-feature imports (`features/a/**` importing from `features/b/**`).
2. No deep imports into a feature bypassing its `index.ts`.
3. `packages/ui` and `packages/api-client` must never import from any app's `features/**` — shared code cannot depend on feature code.
4. No raw Tailwind palette classes (`bg-blue-500`, arbitrary hex) in application or component code — everything goes through the D1 tokens.

Write one deliberate violation of each rule, confirm the build fails, then remove it. Tell me you did this.

---

### D8 — MSW mocks

New workspace package: **`packages/mocks`** (`@repo/mocks`), consumed by both apps via Next 16's `instrumentation.ts` (server) and a client-side worker init (browser) — confirm the exact current MSW + Next.js App Router wiring against MSW's docs rather than assuming an older pattern; this integration point changes between versions.

- Handlers for every `ENDPOINTS` path, with realistic fixtures: 30+ products across 5+ categories, a populated cart, orders spanning all 5 `OrderStatus` values.
- Handlers for the stub services' expected contracts (reviews, stock checks), marked `@stub-backend`.
- Deliberate failure fixtures: 409 insufficient-stock, 403 admin-delete, 500, and an artificially slow response for loading-state testing.
- Env-flag toggle (e.g. `NEXT_PUBLIC_ENABLE_MSW`), off by default in production builds, with a build-time assertion it can't ship to prod.

---

### D9 — Testing baseline

Install and wire Vitest + React Testing Library for unit/component tests, and Playwright for e2e — per `CLAUDE.md` §4.10. Scope for *this task* is infrastructure, not coverage:

- Vitest config working in both apps and `packages/api-client`/`packages/ui`.
- Unit tests for the D4 envelope-unwrapping and error-mapping logic (both response shapes, all mapped status codes).
- One RTL smoke test per new D2 component confirming it renders.
- One Playwright smoke test per app confirming the home/login route loads.
- Add the `test` task to `turbo.json` (currently missing) and a root `pnpm test` script.

---

### D10 — Component showcase page

`apps/web/app/dev/ui/page.tsx`, hidden outside development (env/`NODE_ENV` check, `noindex`). Renders the full D1 token set (color swatches with names+hex, type scale, spacing, radius, shadow, z-index) and every D2 component in its variants and states. This is the ongoing visual spec and review surface in place of Figma.

---

### D11 — Documentation

1. **Extend** `Frontend-developer-guide.md` (do not create a new file) with: the two-app/workspace-package structure; the token system; the boundary rules; how to add an endpoint; the error contract; the query-key convention; the money-as-string rule; MSW usage; the skeleton/empty/error-state rule; commit conventions.
2. A `README.md` in each new package: `packages/api-client`, `packages/auth`, `packages/mocks`, and an update to `packages/ui`'s.
3. Update root `README.md` off the create-turbo boilerplate with real setup/run instructions.

---

## 5. Target structure

```
TechCey-Frontend/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── (auth)/checkout, orders, orders/[id], account
│   │   │   ├── products, products/[id], categories/[slug], search, cart
│   │   │   ├── login, callback, dev/ui
│   │   │   ├── layout.tsx, error.tsx, loading.tsx
│   │   └── features/  {catalog,cart,checkout,orders,account}/
│   └── admin/
│       ├── app/ products, categories, login, callback, layout.tsx
│       └── features/ {products,categories}/
└── packages/
    ├── ui/            # D1 tokens + D2 component library (existing, extended)
    ├── api-client/     # D4 — new
    ├── auth/           # D5 — new
    ├── mocks/          # D8 — new
    ├── eslint-config/  # existing, extended with D7 rules
    └── typescript-config/  # existing
```

---

## 6. Hard prohibitions

- No real feature logic: no live product filtering, no live cart mutations, no live checkout submission, no live order data fetching, no live admin CRUD. Placeholders with real layout/components/fixtures only.
- Do not touch the backend repo or `keycloak/ecommerce-realm.json`. Report what's needed; don't change it.
- No hardcoded URLs, ports, client ids, hex colors, or currency symbols outside `packages/api-client/src/config.ts` and the D1 token files.
- Never send `X-User-Id`/`X-User-Roles` from the frontend.
- Never parse money into `number`.
- No state-management library beyond TanStack Query + React state/context. Ask first if you think more is needed.
- No new dependency outside §2's list without asking, with a one-line justification.
- Don't create a second developer guide file — extend the existing one.

---

## 7. Acceptance criteria

- [ ] `pnpm install && pnpm build` succeeds for both apps.
- [ ] `pnpm lint` passes with `--max-warnings 0`; all 4 D7 boundary rules verified as actually failing the build when violated.
- [ ] `pnpm check-types` passes.
- [ ] `pnpm test` passes (Vitest unit/component + at least one Playwright smoke test per app).
- [ ] Both apps boot, MSW intercepts in dev, every D6 route renders using the real layout and real components.
- [ ] Login redirects to Keycloak and returns to the intended route in both apps. *(Expected to fail if the SPA client isn't configured in the realm — report that clearly as the blocker, don't paper over it.)*
- [ ] Admin routes reject a CUSTOMER-role token; checkout/orders/account reject an unauthenticated user.
- [ ] `/dev/ui` renders the full token set and every D2 component.
- [ ] Zero raw hex / raw Tailwind palette classes outside `packages/ui/src/styles`.
- [ ] Zero URL string literals outside `packages/api-client/src/endpoints.ts`.
- [ ] `Frontend-developer-guide.md` is extended (not duplicated) and a stranger could follow it.
- [ ] All D0 cleanup items resolved.

Finish with a written report: what you built, every decision made where I left the choice open (dark mode, currency/locale, exact Tailwind v4 token mechanism, MSW/Next-16 wiring pattern), and an explicit blockers list (Keycloak SPA client above all).