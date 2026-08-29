import { z } from "zod";
import { DEFAULT_COUNTRY } from "@/core/config/constants";

/** Mirrors order-service's ShippingAddressRequest (all @NotBlank except line2). */
export const checkoutSchema = z.object({
  line1: z.string().min(1, "Street address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP / postal code is required"),
  country: z.string().min(1, "Country is required").default(DEFAULT_COUNTRY),
  notes: z.string().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
