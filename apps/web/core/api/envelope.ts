/**
 * Response envelope handling.
 *
 * Three backend shapes exist:
 *   - order / inventory / payment / user — shared `common` envelope:
 *       { success, message, data, timestamp }
 *   - notification — slim envelope: { success, data }   (no message/timestamp)
 *   - product / review / cart — bare payload, no wrapper at all
 *
 * `unwrapEnvelope` transparently returns `data` for the first two and the body
 * as-is for bare ones, so no feature code ever knows the difference. Kept as a
 * pure function so it is trivially unit-testable (see __tests__).
 */

import { mapHttpError, type AppError } from "@/core/errors/app-error";

interface Envelope {
  success: boolean;
  message?: string;
  data: unknown;
  timestamp?: string;
}

/**
 * Detects both the common `{success,message,data,timestamp}` envelope and
 * notification-service's slim `{success,data}` one. A bare DTO from
 * product/review/cart never carries a boolean `success`, so this stays
 * unambiguous.
 */
export function hasEnvelope(body: unknown): body is Envelope {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    "data" in body &&
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
