# feature: admin

Owns the admin surface: product and category CRUD.

- **Routes:** `/admin/products`, `/admin/categories` (**role-guarded: ADMIN**, AdminLayout).
  Wrapped in `<RoleGuard roles={['ADMIN']}>` at the app route.
- **Backend:** product-service create/update/delete (`ENDPOINTS.products.*`, `ENDPOINTS.categories.*`).
  `DELETE /api/v1/orders/{id}` is also ADMIN-only.
- Note: a separate `apps/admin` Next app also exists in this monorepo. These in-SPA admin routes are the
  brief's requested surface; coordinate with the team on which becomes canonical.
- Public surface: import only from `@/features/admin`.
