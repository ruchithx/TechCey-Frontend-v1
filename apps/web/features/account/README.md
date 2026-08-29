# feature: account

Owns the authenticated customer's "My Account" area. **Customer self-service only** —
admin user management (list / search / roles / activation / deletion) lives in a
separate app and must not be added here.

- **Route:** `/account` (**auth-guarded**, MainLayout). Composed in `pages/pages.tsx`
  from: Personal information · Addresses · Account & security · Orders · Notifications.

## Personal information — `components/profile-card.tsx` + `profile-form.tsx`

- Reads `GET /api/v1/customers/me` via `services/useAccount.ts` (`useAccount()`,
  key `queryKeys.customers.me()`). Identity always comes from the authenticated
  session — no id is ever entered by hand.
- Shown: name (`firstName` + `lastName`), `username`, `email` (+ `emailVerified`
  badge), `phoneNumber`, `preferredLocale`, `roles`. Only fields in
  `CustomerAccountResponse` are shown.
- Editing: `PUT /api/v1/customers/me` via `useUpdateAccount()`. Editable:
  `firstName` / `lastName` (proxied by the backend **to Keycloak**), `phoneNumber`
  / `preferredLocale` (**backend-owned**). Partial update — only changed fields
  are sent. `username` / `email` are Keycloak identity and are **not** editable.
  RHF + Zod (`models/profile-schema.ts`); handles loading, validation, field-level
  errors (`applyFieldErrors`), toast on success/failure, cache refresh.
- `useAuth().currentUser` (from the JWT) still drives the header greeting; it only
  reflects a name change after the next token refresh — the account page reads the
  live query instead.

## Addresses — `components/address-list.tsx` + `address-form.tsx`

- CRUD against `/api/v1/customers/me/addresses` via `services/useAddresses.ts`
  (`useAddresses`, `useAddAddress`, `useUpdateAddress`, `useDeleteAddress`,
  `useSetDefaultAddress`), key `queryKeys.customers.addresses()`.
- Set-default goes through `PUT /api/v1/customers/me` with `defaultAddressId`.
- Mutations invalidate `queryKeys.customers.all` so the derived `isDefault` flag
  stays authoritative. Delete is behind a confirm dialog; add/edit use a dialog
  form. Validation mirrors `AddressRequest` (`models/address-schema.ts`).

## Account & security — `components/account-security.tsx`

- Passwords / 2FA / sessions are **Keycloak's** responsibility. Links open the
  Keycloak Account Console (`core/config/env.ts` → `getAccountConsoleUrl()` /
  `getAccountSecurityUrl()`) in a new tab. No credential handling in the frontend.
- Sign out calls `useAuth().logout()` — the existing OIDC logout, untouched.

## Notifications — `components/notification-list.tsx` + `services/useNotifications.ts`

- Inbox: `GET /api/v1/notifications` (slim `{success,data}` envelope, Spring
  `Page`). Per-item mark-read (`PATCH /{id}/read`), mark-all
  (`PATCH /notifications/read-all`), unread badge
  (`GET /notifications/unread-count`).

## Orders

- Kept as a link to the `orders` feature's `/orders` route — no order logic here.

Public surface: import only from `@/features/account`.
