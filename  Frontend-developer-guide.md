# Frontend Developer Guide — pnpm & Folder Structure

> Read this before writing any frontend code. It covers **pnpm** (new to some of the team) and the
> **mandatory folder structure** for the React app. Pair this with the root `CLAUDE.md` and
> `FRONTEND_STANDARDS.md` for the full rules — this doc focuses on getting set up correctly and not
> breaking the structure.

---

## 1. What is pnpm, and why we use it

pnpm is a package manager, like `npm` or `yarn`, but faster and more disk-efficient.

**Why we picked it over npm/yarn:**
- **Disk space** — pnpm stores every package version **once** on your machine in a global content-
  addressable store, and every project links to it instead of copying files into each project's
  `node_modules`. Across 3 developers with a monorepo, this saves a lot of duplicate installs.
- **Strictness** — pnpm does not let a package silently use a dependency it never declared (npm/yarn
  historically allowed this "phantom dependency" problem). This catches real bugs earlier.
- **Speed** — installs are noticeably faster than npm, especially on repeat installs.
- **Monorepo-native** — pnpm workspaces are a first-class feature, which matters if/when we split the
  frontend into multiple packages (e.g. an app + a shared `ui`/`common` package).

If you've only used `npm install` / `npm run dev` before, the mental model is identical — just a
different command name and a lockfile (`pnpm-lock.yaml` instead of `package-lock.json`).

### 1.1 Installing pnpm

Pick one method:

```bash
# Recommended: via corepack (ships with Node.js 16.13+)
corepack enable
corepack prepare pnpm@latest --activate

# Alternative: via npm
npm install -g pnpm

# Alternative: via curl (Mac/Linux)
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

Verify it worked:
```bash
pnpm --version
```

### 1.2 Command cheat sheet (npm → pnpm)

| What you want to do | npm | pnpm |
|---|---|---|
| Install all dependencies | `npm install` | `pnpm install` |
| Add a dependency | `npm install axios` | `pnpm add axios` |
| Add a dev dependency | `npm install -D vitest` | `pnpm add -D vitest` |
| Remove a dependency | `npm uninstall axios` | `pnpm remove axios` |
| Run a script | `npm run dev` | `pnpm dev` (or `pnpm run dev`) |
| Run a one-off package | `npx create-vite` | `pnpm dlx create-vite` |
| Install exact versions from lockfile (CI) | `npm ci` | `pnpm install --frozen-lockfile` |

### 1.3 Rules for using pnpm on this project

- **Always commit `pnpm-lock.yaml`.** Never commit `package-lock.json` or `yarn.lock` — if either
  appears, delete it; having two lockfiles causes inconsistent installs between developers.
- **Never mix package managers.** Don't run `npm install` in a pnpm project "just this once" — it will
  generate a `package-lock.json` and can corrupt the `node_modules` layout. If you do this by accident,
  delete `node_modules` and `package-lock.json`, then run `pnpm install` again.
- In CI (Jenkins), installs use `pnpm install --frozen-lockfile` so a build **fails** if someone forgot
  to commit a lockfile update — this is intentional, don't work around it by regenerating the lockfile
  in the pipeline.
- If you get a dependency error pnpm didn't complain about before, it's often a **phantom dependency**
  someone was relying on without declaring it — add the missing package explicitly with `pnpm add`
  rather than hoisting/flattening settings to hide it.

---

## 2. Folder structure

Two kinds of folders live under `src/`: a top-level **`components/`** for things every feature can use,
and a **`features/`** directory where each business domain gets its own self-contained folder.

```
src/
├── components/              # ONLY truly cross-feature, reusable UI — nothing feature-specific
│   ├── ui/                  # shadcn/ui primitives (button, input, dialog, etc.) — generated here
│   ├── layout/              # AppShell, Header, Sidebar, Footer
│   └── shared/               # Project-wide wrappers around shadcn (e.g. AppButton, EmptyState,
│                              PageLoader, ErrorBoundaryFallback)
│
├── features/
│   ├── product/
│   │   ├── components/       # Components used ONLY within the product feature
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductList.tsx
│   │   │   └── ProductFilters.tsx
│   │   ├── hooks/            # Custom hooks for this feature (React Query lives here)
│   │   │   ├── useProductList.ts
│   │   │   ├── useProductDetail.ts
│   │   │   └── useCreateProduct.ts
│   │   ├── api/              # Raw API call functions, called only by hooks above
│   │   │   └── productApi.ts
│   │   ├── types/            # TypeScript types/interfaces for this feature
│   │   │   └── product.types.ts
│   │   ├── queryKeys.ts       # Centralized React Query keys for this feature
│   │   └── pages/             # Route-level components that compose the above
│   │       └── ProductListPage.tsx
│   │
│   ├── cart/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── types/
│   │   ├── queryKeys.ts
│   │   └── pages/
│   │
│   └── order/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       ├── types/
│       ├── queryKeys.ts
│       └── pages/
│
├── lib/                      # Framework-level utilities: apiClient, queryClient, auth/Keycloak setup
├── router/                   # Route definitions
└── App.tsx
```

### 2.1 The rule, stated plainly

- **`src/components/` is a shared area only.** If a component is used by more than one feature, or is
  a generic UI primitive/layout piece, it goes here. If you're not sure, it probably belongs in the
  feature folder, not here — it's easier to promote a component up to `components/shared/` later than
  to untangle a shared folder full of feature-specific things.
- **Every feature gets an identical internal shape**: `components/`, `hooks/`, `api/`, `types/`,
  `queryKeys.ts`, `pages/`. Keeping the same sub-folder names across every feature means any developer
  can open an unfamiliar feature folder and immediately know where to look.
- **A component never reaches across into another feature's folder.** `features/cart/components/`
  should not import from `features/order/components/`. If two features need the same piece, that's a
  sign it belongs in `src/components/shared/`, not that one feature should import from another.
- **`api/` files only export plain functions that call the backend** (e.g. `fetchProducts(filters)`).
  They contain no React Query code. `hooks/` files are the only place `useQuery`/`useMutation` are
  called, and they call into `api/` functions.

### 2.2 Naming conventions

| Item | Convention | Example |
|---|---|---|
| Component file | PascalCase, same as component name | `ProductCard.tsx` |
| Hook file/export | `use<Domain><Action>` | `useProductList.ts` exporting `useProductList()` |
| API function | camelCase verb+noun | `fetchProduct(id)`, `createOrder(payload)` |
| Query key factory | `queryKeys.<domain>.<action>` | `queryKeys.products.list(filters)` |
| Types file | `<domain>.types.ts` | `product.types.ts` |

### 2.3 Where does a new file go? (quick decision guide)

1. **Is it a raw shadcn primitive (button, dialog, etc.)?** → `components/ui/`
2. **Is it layout used on every page (header, shell)?** → `components/layout/`
3. **Is it a reusable wrapper/utility component used by 2+ features?** → `components/shared/`
4. **Does it only make sense inside one feature (e.g. `ProductCard`)?** → `features/<feature>/components/`
5. **Does it fetch or mutate server data?** → belongs in a hook in `features/<feature>/hooks/`, calling
   a function in `features/<feature>/api/`
6. **Is it a full page tied to a route?** → `features/<feature>/pages/`

If you genuinely can't tell, default to putting it inside the feature folder — that's the safer
mistake, and it's a small refactor to move it out later if it turns out to be shared.

---

## 3. Getting started checklist (first time on this repo)

```bash
# 1. Install pnpm (see §1.1) if you haven't already
corepack enable
corepack prepare pnpm@latest --activate

# 2. Install dependencies
pnpm install

# 3. Run the dev server
pnpm dev

# 4. Run lint, typecheck, and tests before pushing anything
pnpm lint
pnpm typecheck
pnpm test
```

If any of these commands don't exist yet in `package.json`, check with the team before adding your own
version — script names should stay consistent across the project.