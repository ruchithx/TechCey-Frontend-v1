import { isAppError } from "@/core/errors/app-error";

/** Extract a human-safe message from any thrown value (AppError or otherwise). */
export function getErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (isAppError(error)) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
