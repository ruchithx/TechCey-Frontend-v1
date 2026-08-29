import { z } from "zod";

/**
 * Mirrors user-service's `AddressRequest` validation
 * (`POST/PUT /api/v1/customers/me/addresses`). Field names match order-service's
 * `ShippingAddressRequest` so the platform keeps one address vocabulary.
 *
 *   - `label`   — optional, ≤ 50   ("Home", "Work")
 *   - `line1`   — required, ≤ 255
 *   - `line2`   — optional, ≤ 255
 *   - `city`    — required, ≤ 100
 *   - `state`   — required, ≤ 100
 *   - `zip`     — required, ≤ 20
 *   - `country` — required, ≤ 100
 */
export const addressSchema = z.object({
  label: z.string().trim().max(50, "Keep the label under 50 characters").or(z.literal("")),
  line1: z.string().trim().min(1, "Address line 1 is required").max(255, "Keep line 1 under 255 characters"),
  line2: z.string().trim().max(255, "Keep line 2 under 255 characters").or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100, "Keep the city under 100 characters"),
  state: z.string().trim().min(1, "State is required").max(100, "Keep the state under 100 characters"),
  zip: z.string().trim().min(1, "ZIP / postcode is required").max(20, "Keep the ZIP under 20 characters"),
  country: z.string().trim().min(1, "Country is required").max(100, "Keep the country under 100 characters"),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
