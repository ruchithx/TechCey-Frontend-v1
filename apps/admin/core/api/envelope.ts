/**
 * Response envelope handling.
 *
 * The platform is NOT uniform (see ADMIN_API.md §1):
 *   - order / inventory / payment → common envelope { success, message, data, timestamp }
 *   - notification                → slim envelope   { success, data }
 *   - product / review            → raw DTO, no wrapper
 *
 * `unwrapEnvelope` transparently returns `data` for wrapped responses and the
 * body as-is for bare ones, so no feature code ever knows the difference.
 * Kept as a pure function so it is trivially unit-testable.
 */

import { mapHttpError } from "@/core/errors/app-error";

interface Envelope {
  success: boolean;
  data: unknown;
  message?: string;
  timestamp?: string;
}

/**
 * True for both the common `{success,message,data,timestamp}` and the slim
 * notification `{success,data}` envelopes — the distinguishing feature both
 * share is a boolean `success` alongside a `data` key.
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
