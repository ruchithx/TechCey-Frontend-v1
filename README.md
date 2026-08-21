# TechCey — Frontend

Customer-facing storefront (plus an admin surface) for the **TechCey E-Commerce Platform**.
It talks exclusively to the **API Gateway** (Spring Cloud Gateway) — never directly to any backend
microservice — and authenticates via **Keycloak** (OIDC, Authorization Code + PKCE).

> Core principle: the frontend has **zero knowledge of the microservice topology**. Every request goes to
> one base URL (the gateway). Which service handles it is a backend concern.

This is a **React / Next.js** monorepo (not Angular — see `REPO_STATUS.md` for history).

---

## Architecture

```
┌──────────────┐        HTTPS / JWT Bearer        ┌─────────────┐
│  Next.js SPA │ ───────────────────────────────▶ │ API Gateway │ ──▶ backend services
└──────┬───────┘                                   └─────────────┘
       │  Authorization Code + PKCE
       ▼
┌──────────────┐
│   Keycloak   │
└──────────────┘
```

- The app redirects to Keycloak for login; Keycloak returns an authorization code.
- The OIDC client exchanges it for access + refresh tokens (PKCE, no secret in the browser).
- Every API call sends `Authorization: Bearer <token>` to the gateway — never `X-User-Id`/`X-User-Roles`
  (the gateway strips and re-injects those). Tokens refresh silently; a 401 triggers refresh then re-login.

---

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 · shadcn/ui (`@repo/ui`) ·
TanStack Query · react-oidc-context · MSW · pnpm + Turborepo.

## Monorepo layout

```
apps/
  web/          # customer storefront + admin routes (port 3000)  ← the foundation lives here
  admin/        # separate starter app (port 3001)
packages/
  ui/           # @repo/ui — shared shadcn/ui components + design tokens (globals.css)
  eslint-config/        # @repo/eslint-config
  typescript-config/    # @repo/typescript-config
```

---

## Getting started

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local     # adjust if needed
pnpm --filter web dev                             # http://localhost:3000  (MSW mocks on by default)
```

Open `/dev/ui` to see the full design-token spec. With MSW enabled the app runs with **no live backend**.

### Workspace scripts
```bash
pnpm build         # build every app
pnpm lint          # eslint across the workspace (0 warnings allowed)
pnpm test          # vitest unit tests
pnpm check-types   # tsc --noEmit
```

---

## Documentation

- **`FRONTEND_DEVELOPER_GUIDE.md`** — day-one guide: tokens, API layer, auth, boundaries, money rule,
  error handling, MSW, commit conventions. **Start here.**
- **`REPO_STATUS.md`** — current state of the repo (structure, packages, known issues).
- **`CLAUDE.md`** — project rules and conventions (authoritative).
- Per-area READMEs: `apps/web/core/api`, `apps/web/core/auth`, `apps/web/features`, `apps/web/mocks`.

---

## Environment

All config is public (browser-exposed), read only from `apps/web/core/config`. See `apps/web/.env.example`.
Key values: `NEXT_PUBLIC_API_BASE_URL` (gateway), `NEXT_PUBLIC_KEYCLOAK_ISSUER`,
`NEXT_PUBLIC_KEYCLOAK_CLIENT_ID`, `NEXT_PUBLIC_ENABLE_MSW`.

> ⚠ The Keycloak SPA client (`techcey-spa`, public + PKCE) must be registered in the realm with this
> app's origin in Valid Redirect URIs + Web Origins. See the guide's "Blockers" section.
