# features — feature-based modules

Each folder mirrors a backend service boundary and owns its own UI, data access,
types, and routes. Ownership is by folder: two developers can work in
`features/catalog` and `features/cart` without colliding.

## Fixed shape (per feature)
```
features/<domain>/
├── components/        # private to this feature
├── pages/             # routed components
├── services/          # data-access hooks (use<Domain><Action>, wrap useQuery/useMutation)
├── models/            # feature-local types
├── <domain>.routes.ts # route-ownership manifest
├── index.ts           # the ONLY public surface
└── README.md
```

## Boundary rules (lint-enforced — they fail the build)
1. A feature must **not** import another feature. Share via `@/core` or `@/components`; import your own
   files with **relative** paths.
2. Import a feature only through its `index.ts` — no deep imports (`@/features/x/pages/...`).
3. Shared code (`core/`, `components/`, `layouts/`) must **not** import features.

## Features & owners
| Feature | Routes | Guard |
|---|---|---|
| catalog | `/`, `/products`, `/products/:id`, `/categories/:slug`, `/search` | — |
| cart | `/cart` | — |
| checkout | `/checkout` | auth |
| orders | `/orders`, `/orders/:id` | auth |
| account | `/account` | auth |
| auth | `/login`, `/callback` | — |
| admin | `/admin/products`, `/admin/categories` | role ADMIN |

Routes are wired in `app/` (Next App Router) as thin segments that render each feature's page.
