# feature: account

Owns the authenticated customer's own account area. **Customer self-service only** —
admin user management (list / search / roles / activation / deletion) lives in a
separate feature and must not be added here.

- **Route:** `/account` (**auth-guarded**, MainLayout).
- **Profile** (`components/profile-card.tsx` + `profile-form.tsx`):
  - Reads the real backend contract via `services/useCurrentUser.ts` →
    `GET /api/v1/users/me` (`queryKeys.users.me()`). Identity always comes from the
    authenticated session — no id is ever entered by hand.
  - Fields shown: name (`firstName` + `lastName`), `username`, `email`
    (+ `emailVerified` badge), `roles`. Only fields in `CurrentUserResponse` are shown.
  - Editing: `PATCH /api/v1/users/me` via `useUpdateProfile()` — `firstName` /
    `lastName` only (RHF + Zod `models/profile-schema.ts`). `username` / `email` are
    Keycloak-managed and not editable. Handles loading, validation, field-level
    errors (`applyFieldErrors`), toast on success/failure, and cache refresh.
- `useAuth().currentUser` (from the JWT) still drives the header greeting; it only
  reflects a name change after the next token refresh — the account page reads the
  live query instead.
- Notifications inbox: `components/notification-list.tsx` + `services/useNotifications.ts`.
- Public surface: import only from `@/features/account`.
