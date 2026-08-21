# TechCey Frontend — Developer Guide

Everything a developer joining on day one needs. This covers the **Tier-0 foundation**
(`apps/web`): design tokens, the HTTP/API layer, auth, the app shell, feature boundaries,
mocks, and the conventions all three developers must follow.

> Stack: **Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 · shadcn/ui
> (`@repo/ui`) · TanStack Query · react-oidc-context · MSW**, in a **pnpm + Turborepo** monorepo.
> (The original task brief was written for Angular; this repo is React/Next — see `REPO_STATUS.md`.)

---

## 1. Getting started

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # adjust if needed
pnpm --filter web dev                           # http://localhost:3000  (MSW on by default)
```

Repo-wide:
```bash
pnpm build         # build every app
pnpm lint          # eslint, 0 warnings allowed
pnpm test          # vitest (unit)
pnpm check-types   # tsc --noEmit
```

With MSW on, the app runs with **no live backend**. Visit `/dev/ui` to see the full design-token spec.

---

## 2. Folder structure (`apps/web`)

```
app/                 # Next App Router — thin route segments + layouts/error/loading
  (main)/            # storefront routes (MainLayout)
  (auth)/            # /login, /callback (AuthLayout)
  (admin)/           # /admin/* (AdminLayout, guarded ADMIN)
core/
  api/               # endpoints, http, envelope, money, page, query keys/client, DTOs
  auth/              # OIDC provider, useAuth, guards, jwt, login-success seam
  config/            # env + constants (currency, locale, client id) — the only place reading process.env
  errors/            # AppError + mapping
components/          # cross-feature shared UI (most shared UI is in @repo/ui)
layouts/             # MainLayout / AuthLayout / AdminLayout + header/footer
features/<domain>/   # feature modules (see §5)
mocks/               # MSW handlers + fixtures
styles/ (in @repo/ui/src/styles/globals.css)  # design tokens — single source of truth
```

Import alias: `@/*` → `apps/web/*`. Shared UI: `@repo/ui/components/*`, `@repo/ui/lib/*`.

---

## 3. Design tokens

Tokens live **once** in `packages/ui/src/styles/globals.css` (imported by `app/globals.css`).
They are semantic CSS variables mapped into Tailwind, so you write utilities, never raw values:

- Color: `bg-primary`, `text-muted-foreground`, `border-border`, `bg-destructive`, `bg-success`…
- Radius: `rounded-sm|md|lg|xl`. Shadow: `shadow-e1|e2|e3`. Z-index: `z-dropdown|sticky|overlay|modal|toast`.
- Type: the scale `text-xs…text-4xl`; **prices/SKUs/order numbers use `.font-tabular`** (monospace, tabular figures).
- Layout: `.container-page` (max width + responsive gutters).

**Rules (lint-enforced):** no raw hex, no raw Tailwind palette classes (`bg-blue-600`). Change a token in
`globals.css` — once. Dark mode is the `class` strategy (`<html class="dark">`); the full dark set exists.

---

## 4. Data fetching (TanStack Query)

- **Never call `useQuery`/`useMutation` in a component.** Wrap in a hook in `features/<domain>/services/`,
  named `use<Domain><Action>` (e.g. `useProductList`).
- Every hook calls `request()` from `@/core/api` with a path from `ENDPOINTS`. `request()` attaches the
  bearer token, unwraps the response envelope, normalises errors to `AppError`, and times out.
- **Query keys** come from `queryKeys.*` (`@/core/api`). Read and invalidate through the same key — never
  inline a key array.
```ts
export function useProductList(filters: ProductListParams) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => request<Page<ProductResponse>>(ENDPOINTS.products.list(), { params: filters })
      .then(normalisePage),
    staleTime: 60_000,
  });
}
```
- Set `staleTime`/`gcTime` per data type (catalog can be stale longer than cart).
- Use optimistic updates + rollback for cart/order mutations.
- Filters/pagination live in the **URL** (searchParams), not component state.

## 4a. Adding an API endpoint
1. `core/api/endpoints.ts` — add the path (the only file with URL strings).
2. `core/api/types.ts` — add/adjust the DTO.
3. `core/api/query-keys.ts` — add a key if it's queried.
4. `features/<domain>/services/` — add the hook.

---

## 5. Feature boundaries

Fixed shape per feature: `components/ pages/ services/ models/ <domain>.routes.ts index.ts`.
**`index.ts` is the only public surface.** Lint fails the build on:
1. cross-feature imports, 2. deep imports that bypass `index.ts`, 3. shared code importing features,
4. raw palette/hex classes. Import a feature via `@/features/<domain>`; import your own files relatively.

---

## 6. Errors — three distinct layers

1. **Render crashes** → `app/error.tsx` global error boundary.
2. **Data failures** → React Query error state (`isError`, `error` is an `AppError`).
3. **Mutation failures** → toast/notification (add the toast in the feature).

`AppError` = `{ status, code, message, fieldErrors?, raw? }`. Switch on `code`, show `message`.
Notable codes: `INSUFFICIENT_STOCK` (409 stock), `UNAUTHENTICATED` (401 → refresh/login handled centrally
in `core/api` + `core/auth`), `OFFLINE` (status 0). Apply fail-open vs fail-closed per feature (e.g.
recommendations degrade silently; checkout blocks).

---

## 7. Money as string (non-negotiable)

Backend money is `NUMERIC` serialised as a **string**. **Never `Number()` it for arithmetic** —
floating point misprices real orders. Use the branded `Money` type and helpers from `@/core/api`:
`sumMoney`, `multiplyMoney` (integer cents), and `formatMoney(value, currency, locale)` only at display.
Currency/locale come from `DEFAULT_CURRENCY` / `DEFAULT_LOCALE` in `core/config/constants.ts`.

---

## 8. Loading states

Skeletons for **content** loads (lists, detail); spinners only for **button-level** actions
(a submitting button). Route-level transitions use `app/loading.tsx`.

---

## 9. Running MSW

On by default in dev (`NEXT_PUBLIC_ENABLE_MSW`). Handlers in `mocks/`. Failure fixtures: `keyword=__error__`
(500), `keyword=__slow__` (3 s), over-stock cart add (409), order delete (403). A build-time guard prevents
MSW shipping to production.

---

## 10. Auth quickref

Client-side PKCE against Keycloak realm `ecommerce`. `useAuth()` gives
`{ isAuthenticated, currentUser, hasRole, login, logout }`. Guard pages with `<AuthGuard>` /
`<RoleGuard roles={['ADMIN']}>`. Send only the bearer token — never `X-User-Id`/`X-User-Roles`.
See `core/auth/README.md`.

---

## 11. Commit conventions

Conventional commits, scoped by deliverable:
`feat(tokens): …`, `feat(api): …`, `feat(auth): …`, `feat(shell): …`, `feat(lint): …`,
`feat(mocks): …`, `feat(showcase): …`, `docs(guide): …`, `chore(repo): …`.
Branch off `main`; the CI required checks are lint → typecheck → test → build.

---

## 12. Blockers / things to verify

- **Keycloak SPA client** — `techcey-spa` must exist as a **public PKCE** client with this origin in Valid
  Redirect URIs + Web Origins. If only `gateway-client` (confidential) exists, login will fail; a client
  must be added to the backend's `keycloak/ecommerce-realm.json` (do not edit from the admin console —
  `--import-realm` wipes it). We do not edit the backend repo.
- **Currency/locale** — defaulted to `USD` / `en-US` (matches the orders `US` default). Confirm the real market.
- **`Page<T>` shape** — confirm product-service `PageResponse` vs order-service `PagedResponse` against
  `/api-docs`; `normalisePage` tolerates both but the exact fields should be verified.
- **Dark mode** — full token set shipped; confirm the visual direction on `/dev/ui`.
- **DTOs** are hand-written (`TODO(openapi)`); regenerate via `pnpm --filter web api:types` once services
  are reachable.
