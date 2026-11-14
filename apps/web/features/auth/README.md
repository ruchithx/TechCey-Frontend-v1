# feature: auth

Owns the login/signup/callback **UI** only. All auth plumbing lives in `@/core/auth`
(provider, `useAuth`, guards, JWT decode, login-success seam).

- **Routes:** `/login`, `/signup`, `/callback` (AuthLayout, public).
- `/login` and `/signup` are both thin launchers into the same Authorization Code + PKCE
  redirect — there is no local email/password form and no direct backend registration call.
  `/signup` sends the standard OIDC `prompt=create` param (`useAuth().signup()`), which lands
  the user on Keycloak's hosted registration form instead of its login form; everything else
  (state, PKCE verifier, redirect_uri) is identical to `/login`. Keycloak remains the sole
  owner of credentials and account creation.
- `/callback` is where Keycloak returns after PKCE; react-oidc-context exchanges the code
  automatically, then we redirect to the preserved return path (`takeReturnTo()`).
- Public surface: import only from `@/features/auth`.

## Blocker to verify (same as `/login`)
`prompt=create` requires the realm's **User registration** setting enabled, and the SPA client
(`techcey-spa`) to exist as a public PKCE client — see `FRONTEND_DEVELOPER_GUIDE.md` → Blockers.
We do not edit the backend/realm config from this repo.
