# feature: auth

Owns the login/callback **UI** only. All auth plumbing lives in `@/core/auth`
(provider, `useAuth`, guards, JWT decode, login-success seam).

- **Routes:** `/login`, `/callback` (AuthLayout, public).
- `/callback` is where Keycloak returns after PKCE; react-oidc-context exchanges the code
  automatically, then we redirect to the preserved return path (`takeReturnTo()`).
- Public surface: import only from `@/features/auth`.
