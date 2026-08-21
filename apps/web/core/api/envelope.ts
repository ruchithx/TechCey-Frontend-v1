/**
 * Response envelope handling.
 *
 * order-service wraps every response in the shared `common` envelope:
 *   { success, message, data, timestamp }
 * product-service and cart-service return bare payloads.
 *
 * `unwrapEnvelope` transparently returns `data` for wrapped responses and the
 * body as-is for bare ones, so no feature code ever knows the difference.
 * Kept as a pure function so it is trivially unit-testable (see __tests__).
 */

import { mapHttpError, type AppError } from "@/core/errors/app-error";

interface Envelope {
  success: boolean;
  message: string;
  data: unknown;
  timestamp: string;
}

export function hasEnvelope(body: unknown): body is Envelope {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    "data" in body &&
    "timestamp" in body &&
    typeof (body as Record<string, unknown>).success === "boolean"
  );
}

/**
 * Returns the meaningful payload for a successful response.
 * Throws an AppError if the envelope reports `success: false`.
 */
export function unwrapEnvelope(body: unknown, status = 200): unknown {
  if (hasEnvelope(body)) {
    if (!body.success) {
      throw mapHttpError(status >= 400 ? status : 400, body);
    }
    return body.data;
  }
  return body;
}

export type { AppError };
