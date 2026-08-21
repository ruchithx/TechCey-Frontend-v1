# feature: account

Owns the authenticated user's account area.

- **Route:** `/account` (**auth-guarded**, MainLayout).
- Reads identity from `useAuth().currentUser` (`{ id, username, email, roles }`).
- Public surface: import only from `@/features/account`.
