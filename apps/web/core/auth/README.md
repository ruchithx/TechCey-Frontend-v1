# core/auth — Authentication (D3)

Client-side OIDC (Authorization Code + PKCE) against Keycloak realm `ecommerce`,
via `react-oidc-context` / `oidc-client-ts`. Adapted to Next.js App Router: the
OIDC provider mounts client-side only, and route guards are wrapper components.

## Files
| File | Responsibility |
|---|---|
| `oidc-config.ts` | Builds the OIDC config from env. sessionStorage token store; `automaticSilentRenew`. |
| `auth-provider.tsx` | `<AuthProvider>` — wraps react-oidc-context, registers the HTTP token + 401 handlers, emits login-success. |
| `use-auth.ts` | `useAuth()` — `{ isAuthenticated, isLoading, currentUser, hasRole, login, signup, logout }`. |
| `guards.tsx` | `<AuthGuard>` and `<RoleGuard roles={[...]}>` wrapper components. |
| `jwt.ts` | Decode `sub` / `preferred_username` / `email` / `realm_access.roles` from the access token (display only). |
| `on-login.ts` | `onLoginSuccess(cb)` seam — the cart feature subscribes here to run cart-merge. |
| `index.ts` | Public surface — import from `@/core/auth`. |

## Contract
- Send **only** `Authorization: Bearer <token>`. Never send `X-User-Id` / `X-User-Roles` — the gateway
  strips and re-injects them from verified claims.
- 15-minute access tokens ⇒ silent refresh is on. A 401 triggers one silent refresh, then a login
  redirect that preserves the attempted URL (`takeReturnTo()`).
- Token storage is **sessionStorage** (not localStorage): smaller XSS/persistence surface; cleared on
  tab close.

## Sign up
`signup(returnTo?)` reuses the exact same Authorization Code + PKCE redirect as `login()`, adding
the standard OIDC `prompt=create` param so Keycloak opens its registration form instead of its
login form. There is no separate signup client, endpoint, or local credential form — Keycloak is
the sole owner of account creation, consistent with §1 of the root `CLAUDE.md` (Keycloak pinned,
no bypassing it). Requires the realm's "User registration" setting to be on.

## Guarding a route
```tsx
// app/(main)/checkout/page.tsx
export default function Page() {
  return <AuthGuard><CheckoutPage /></AuthGuard>;
}
// admin group is guarded once in app/(admin)/layout.tsx with <RoleGuard roles={['ADMIN']}>.
```

## Cart-merge seam
`cart-service` exposes `POST /api/cart/merge`. Subscribe from the cart feature:
```ts
onLoginSuccess((user) => { /* call ENDPOINTS.cart.merge() */ });
```
The seam is wired here; the merge logic belongs to the cart feature owner.
