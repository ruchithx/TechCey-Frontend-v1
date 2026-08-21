# TechCey Frontend — Repository Status

> Snapshot of the frontend repo **as it actually exists today**, for anyone (human or Claude Code)
> starting work here. Generated 2026-08-21.

---

## 0. TL;DR — the one thing to know first

**This is a React / Next.js Turborepo monorepo. It is NOT an Angular project.**

The task brief `initialize-project.md` was written assuming **Angular** (standalone components, signals,
`angular-oauth2-oidc`, spartan/ui, MSW, Vite). None of that applies. The brief's own §2 and its Appendix
say: *if this is a React project, stop and flag it before writing any code* — which is why no foundation
code from that brief has been written yet. The **contracts, rules, and deliverable structure** in the brief
still translate; the **framework, routing, auth, and UI-library choices** must be the React/Next equivalents
(Next.js App Router, `react-oidc-context`/`oidc-client-ts`, shadcn/ui, etc.).

---

## 1. What this repo is

- **Product:** TechCey — a customer-facing e-commerce SPA plus a small admin surface, consuming a Spring
  Boot microservices backend (separate repo) through a single API Gateway.
- **Repo type:** **Turborepo monorepo** managed with **pnpm workspaces**.
- **Scaffold origin:** Generated from `create-turbo` (the official Turborepo starter). Most files are still
  the untouched starter — the customer/admin apps are essentially the create-turbo demo pages with
  TanStack Query wired in. **No feature work has started.**

### Toolchain versions

| Tool | Version |
|---|---|
| Node | v24.12.0 (repo `engines` requires `>=18`) |
| Package manager | **pnpm 9.0.0** (via `packageManager` field) |
| Turborepo | ^2.10.11 |
| Next.js | **16.3.0** (App Router) |
| React | ^19.2.0 |
| TypeScript | 5.9.2 (strict mode on) |
| Tailwind CSS | **v4** (^4.3.3, CSS-first — no `tailwind.config` tokens) |
| ESLint | ^9.39.1 (flat config) |

---

## 2. Monorepo layout

```
TechCey-Frontend/
├── package.json              # root: turbo scripts (build/dev/lint/format/check-types)
├── pnpm-workspace.yaml       # workspaces: apps/*, packages/*
├── turbo.json                # task graph (build/lint/dev/check-types)
├── pnpm-lock.yaml            # single lockfile for the whole workspace
├── CLAUDE.md                 # project rules (authoritative — read this)
├── README.md                 # create-turbo boilerplate (not yet customized)
├── Frontend-developer-guide.md   # EXISTS ALREADY (8.8 KB) — pre-written guide
├── initialize-project.md     # the Angular-assuming task brief (untracked)
├── REPO_STATUS.md            # this file
│
├── apps/
│   ├── web/                  # CUSTOMER app  (Next.js, port 3000)   name: "web"
│   └── admin/                # ADMIN app     (Next.js, port 3001)   name: "docs"  ⚠ still named "docs"
│
└── packages/
    ├── ui/                   # @repo/ui — shared shadcn/ui component library
    ├── eslint-config/        # @repo/eslint-config — shared flat ESLint configs
    └── typescript-config/    # @repo/typescript-config — shared tsconfig bases
```

There are **two separate Next.js apps**, not one SPA with an internal `/admin`. This differs from the
brief, which assumed a single SPA. `apps/admin` is currently the create-turbo "docs" demo — its
`package.json` name is still literally **`"docs"`** and needs renaming.

---

## 3. Workspaces in detail

### 3.1 `apps/web` — customer app (`name: "web"`, dev port 3000)

Next.js 16 App Router. Current files are the create-next-app starter:

```
apps/web/
├── app/
│   ├── layout.tsx        # root layout, Geist fonts, wraps <Providers>
│   ├── page.tsx          # default Next.js starter landing page
│   ├── providers.tsx     # TanStack Query client provider (+ devtools), SSR-safe
│   ├── globals.css       # Tailwind v4 @import + starter styles (light/dark via prefers-color-scheme)
│   ├── page.module.css   # starter demo styles (raw hex colors — to be removed)
│   ├── fonts/            # GeistVF.woff, GeistMonoVF.woff (local fonts)
│   └── favicon.ico
├── components/           # EMPTY  (placeholder dir)
├── features/             # EMPTY  (placeholder dir)
├── util/                 # EMPTY  (placeholder dir)
├── public/               # starter SVGs (next, vercel, turborepo, globe, window, file-text)
├── eslint.config.js      # re-exports @repo/eslint-config/next-js
├── next.config.js        # empty config ({})
├── postcss.config.mjs    # @tailwindcss/postcss
├── tsconfig.json         # extends @repo/typescript-config/nextjs.json, adds strictNullChecks
├── tailwind.config.ts    # ⚠ BROKEN & UNTRACKED — see §6
└── package.json
```

**`apps/web` dependencies:** `@repo/ui` (workspace), `@tanstack/react-query` ^5.101.4, `next` 16.3.0,
`react`/`react-dom` ^19.2.0.
**Dev deps:** `@tanstack/react-query-devtools`, `@tailwindcss/postcss`, `tailwindcss` ^4.3.3, eslint 9,
types, `@repo/eslint-config`, `@repo/typescript-config`.

### 3.2 `apps/admin` — admin app (`name: "docs"` ⚠, dev port 3001)

Structurally identical to `apps/web` (same starter files, same deps), **minus** `tailwind.config.ts`.
It is the create-turbo docs demo and has not been repurposed for admin yet. Package name still `"docs"`.

### 3.3 `packages/ui` — `@repo/ui` shared component library

**shadcn/ui is already initialized here.** This is the mandated component library (per CLAUDE.md §4.1).

```
packages/ui/
├── components.json           # shadcn config: style "new-york", baseColor "neutral", rsc: false,
│                             #   css → src/styles/globals.css, icon lib → lucide
├── src/
│   ├── components/
│   │   ├── button.tsx        # shadcn Button (already added)
│   │   ├── card.tsx          # shadcn Card (already added)
│   │   └── dialog.tsx        # shadcn Dialog (already added)
│   └── lib/
│       └── utils.ts          # cn() helper (clsx + tailwind-merge)
├── package.json
├── package-lock.json         # ⚠ stray npm lockfile inside a pnpm workspace
└── tsconfig.json
```

**Exports:** `./components/*`, `./lib/*`, `./globals.css` (→ `src/styles/globals.css`).
**Runtime deps:** `class-variance-authority`, `clsx`, `tailwind-merge`, `radix-ui`, `lucide-react`,
`tw-animate-css`, react.
**Dev deps:** `shadcn` ^4.18.0, eslint, types, shared configs.

Three components exist so far: **Button, Card, Dialog.**

### 3.4 `packages/eslint-config` — `@repo/eslint-config`

Shared flat ESLint configs, exported as `./base`, `./next-js`, `./react-internal`.
- `base.js` — `@eslint/js` recommended + `typescript-eslint` recommended + Turbo plugin + Prettier.
- `next.js` — base + `eslint-plugin-react`, `eslint-plugin-react-hooks`, `@next/eslint-plugin-next`
  (recommended + core-web-vitals).
- Includes **`eslint-plugin-only-warn`**, which downgrades *all* errors to warnings; apps then run
  `eslint --max-warnings 0`, so any warning still fails CI. Keep this in mind when adding the D5 boundary
  rules — they'll surface as warnings but still break the build.

### 3.5 `packages/typescript-config` — `@repo/typescript-config`

Shared tsconfig bases: `base.json`, `nextjs.json`, `react-library.json`.
`base.json` is strict: `strict: true`, `noUncheckedIndexedAccess: true`, `isolatedModules`, ES2022,
NodeNext resolution. `nextjs.json` extends it for Next (jsx preserve, Bundler resolution, noEmit).

---

## 4. Root scripts & task pipeline

Root `package.json` scripts (all fan out through Turbo):

| Script | Command | Notes |
|---|---|---|
| `build` | `turbo run build` | per-app `next build` |
| `dev` | `turbo run dev` | persistent, uncached |
| `lint` | `turbo run lint` | `eslint --max-warnings 0` per package |
| `format` | `prettier --write "**/*.{ts,tsx,md}"` | |
| `check-types` | `turbo run check-types` | `next typegen && tsc --noEmit` |

`turbo.json` declares `build` (depends on `^build`, outputs `.next/**`), `lint`, `check-types`, and a
persistent uncached `dev`. There is **no `test` task configured** yet (no test runner installed anywhere).

---

## 5. Installed packages — consolidated

**Present across the workspace:** Next.js 16, React 19, TanStack Query 5 (+ devtools), Tailwind v4 +
`@tailwindcss/postcss`, shadcn tooling + Radix + CVA + clsx + tailwind-merge + lucide-react +
tw-animate-css (in `@repo/ui`), ESLint 9 flat config stack, TypeScript 5.9, Prettier, Turbo.

**NOT installed yet** (needed for the foundation work, per CLAUDE.md / brief intent):
- Auth: `react-oidc-context` / `oidc-client-ts` (Keycloak PKCE) — *nothing auth-related installed*
- Forms/validation: `react-hook-form`, `zod`
- API mocking: `msw`
- Type generation: `openapi-typescript`
- Testing: `vitest` / React Testing Library / Playwright — *no test tooling at all*
- Boundary lint: `eslint-plugin-boundaries` (or `no-restricted-imports` rules)

---

## 6. Known issues / cleanup needed

1. **`apps/web/tailwind.config.ts` is broken and untracked.** Its entire contents are:
   `content: ["../../packages/ui/src/**/*.{ts,tsx}"]` — a bare fragment with no object wrapper and no
   `export`. It's also moot under **Tailwind v4**, which is CSS-first (`@import "tailwindcss"` +
   `@source` + `@theme` in CSS, not a JS config). **Recommend deleting it**; content scanning is already
   handled by `@source` in `globals.css`.
2. **`packages/ui/src/styles/globals.css` is missing.** `package.json` exports `./globals.css` →
   `src/styles/globals.css` and `components.json` points shadcn's CSS there, but the file/dir doesn't
   exist. Design tokens (brief D1) should live here.
3. **`apps/admin` package name is still `"docs"`.** Leftover from the create-turbo template; rename to
   something like `admin` to avoid confusion.
4. **Stray `packages/ui/package-lock.json`** (npm) inside a pnpm workspace — should be removed; the root
   `pnpm-lock.yaml` is the single source of truth.
5. **Starter cruft in both apps:** `app/page.tsx` is the Next.js demo page and `page.module.css` contains
   raw hex colors (`#383838`, `#f2f2f2`, …) that will violate the "no raw hex" rule once D1/D5 land.
6. **README not customized** — still create-turbo boilerplate.
7. **No testing setup** — CLAUDE.md §4.10 mandates RTL + MSW + Playwright; none installed.
8. **Duplicate/pre-existing guide:** `Frontend-developer-guide.md` already exists at root; the brief's D8
   asks for `FRONTEND_DEVELOPER_GUIDE.md` — extend the existing file rather than create a second one.

---

## 7. Alignment with CLAUDE.md conventions

| CLAUDE.md rule (§4) | Current state |
|---|---|
| All UI from shadcn/ui, no other lib | ✅ shadcn set up in `@repo/ui`; no MUI/Ant/Chakra present |
| Feature-based folders mirroring backend | ⚠ empty `features/` dir exists; structure not built |
| React Query, hooks-only in `hooks/` | ⚠ Query provider wired; no hooks/`queryKeys.ts`/`apiClient` yet |
| Server state only in React Query, no Redux/Zustand | ✅ none installed |
| React Hook Form + Zod | ❌ not installed |
| Tailwind + design tokens only | ⚠ Tailwind v4 present; **no tokens defined**, starter hex remains |
| No `any`, strict mode | ✅ strict TS; no app code to violate yet |
| Route code-splitting, error boundaries | ❌ not built (App Router gives some of this natively) |
| MSW for tests, Testcontainers-style mocking | ❌ MSW not installed |

**Net:** the scaffolding and guardrails (shadcn, Query, strict TS, shared configs, boundary-ready ESLint)
are in place; **none of the actual foundation deliverables (tokens, api layer, auth, shell, routes, mocks)
exist yet.**

---

## 8. Backend it talks to (for context)

Single entry point: **API Gateway** — frontend uses one base URL and never calls a service port directly.
Roles `CUSTOMER` / `ADMIN` via Keycloak (realm `ecommerce`), JWT with roles at `realm_access.roles[]`.
Services behind the gateway: product, cart, order (complete); payment, inventory, notification, review
(stubs). Response envelopes are inconsistent (order-service wraps in `ApiResponse<T>`; product/cart return
bare payloads) and path prefixes differ (`/api/...` vs `/api/v1/...`) — the HTTP layer must normalize both.
See `initialize-project.md` §1 for the exact data contracts and `CLAUDE.md` for the rules.

> Note: an older internal note listed per-service ports (product 8082, cart 8081, order 8083). The current
> authoritative model is **gateway-only** — follow `CLAUDE.md` / the brief, not the per-port note.

---

## 9. How to run

```bash
pnpm install          # install all workspaces
pnpm dev              # run every app (web:3000, admin:3001) via turbo
pnpm --filter web dev # run just the customer app
pnpm lint             # eslint across the workspace (0 warnings allowed)
pnpm check-types      # tsc --noEmit across the workspace
pnpm build            # next build for every app
```

There is currently **no `pnpm test`** (no test runner configured).
