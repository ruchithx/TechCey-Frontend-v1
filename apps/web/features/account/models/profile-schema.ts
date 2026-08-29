import { z } from "zod";

/**
 * Mirrors user-service's `UpdateCustomerRequest` validation for the fields the
 * customer can edit through `PUT /api/v1/customers/me`:
 *
 *   - `firstName` / `lastName` — 1..255 chars. Proxied to Keycloak. Always shown
 *     pre-filled from the current profile, so the form submits them as required.
 *   - `phoneNumber` — optional, ≤ 30 chars, digits and `+ ( ) - . space` only.
 *     Backend-owned.
 *   - `preferredLocale` — optional, ≤ 10 chars (e.g. `en-US`). Backend-owned.
 *
 * Empty optional fields are kept as `""` here (RHF inputs are never undefined);
 * the submit handler converts `""` back to "leave unchanged". `username` and
 * `email` are Keycloak identity (`editUsernameAllowed=false`) and are NOT part
 * of this schema — the UI shows them read-only.
 */
const PHONE_PATTERN = /^[+()\d][\d\s().-]*$/;

export const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(255, "Keep the first name under 255 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(255, "Keep the last name under 255 characters"),
  phoneNumber: z
    .string()
    .trim()
    .max(30, "Keep the phone number under 30 characters")
    .regex(PHONE_PATTERN, "Use only digits and + ( ) - . spaces")
    .or(z.literal("")),
  preferredLocale: z
    .string()
    .trim()
    .max(10, "Use a short locale code like en-US")
    .or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
