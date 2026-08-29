import { z } from "zod";

/**
 * Mirrors user-service's `UpdateProfileRequest` validation: `firstName` and
 * `lastName` are each 1..255 characters (the realm rejects blank values). Both
 * are shown pre-filled from the current profile, so the form always submits
 * both — `username` and `email` are owned by Keycloak and are not editable here.
 */
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
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
