import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { isAppError } from "@/core/errors/app-error";

/**
 * Map a backend 400 validation response onto react-hook-form fields. Field names
 * that exist in the form are attached inline; anything else is returned so the
 * caller can surface it as a toast. Returns true if a form field was set.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly Path<T>[],
): boolean {
  if (!isAppError(error) || !error.fieldErrors) return false;
  let applied = false;
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    if ((knownFields as readonly string[]).includes(field)) {
      setError(field as Path<T>, { type: "server", message });
      applied = true;
    }
  }
  return applied;
}
