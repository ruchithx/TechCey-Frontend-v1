/**
 * The single normalised error type for the whole admin console. Every failure
 * path — order-service `ApiResponse` errors, product/review bare bodies, RFC
 * 9457 ProblemDetail, network failures, timeouts — is mapped into an `AppError`.
 * Feature code only ever sees this.
 */

export interface AppError {
  /** HTTP status, or 0 for a network / offline failure. */
  status: number;
  /** Machine-readable code, e.g. 'CONFLICT'. Switch on this, not the message. */
  code: AppErrorCode;
  /** Human-safe message, OK to show a user. */
  message: string;
  /** Present for 400 validation responses: field name -> message. */
  fieldErrors?: Record<string, string>;
  /** Raw payload, attached in dev only for debugging. Never render this. */
  raw?: unknown;
}

export type AppErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "OFFLINE"
  | "TIMEOUT"
  | "UNKNOWN";

const DEFAULT_MESSAGES: Record<AppErrorCode, string> = {
  VALIDATION: "Please check the highlighted fields and try again.",
  UNAUTHENTICATED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You do not have permission to do that.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  CONFLICT: "That action conflicts with the current state.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  SERVER_ERROR: "Something went wrong on our end. Please try again.",
  OFFLINE: "You appear to be offline. Check your connection.",
  TIMEOUT: "The request took too long. Please try again.",
  UNKNOWN: "An unexpected error occurred.",
};

/** Type guard usable in `onError` handlers and error boundaries. */
export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "code" in value &&
    "message" in value
  );
}

/**
 * Map an HTTP status + parsed body into an AppError.
 *
 * `body` may be any of the backend shapes:
 *   - order/inventory/payment ErrorResponse: { success:false, message, errorCode?, errors? }
 *   - RFC 9457 ProblemDetail:                { title, detail, status, ... }
 *   - product/review bare body / unknown
 */
export function mapHttpError(status: number, body: unknown): AppError {
  const record = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;

  const backendMessage =
    typeof record.message === "string"
      ? record.message
      : typeof record.detail === "string"
        ? record.detail
        : typeof record.title === "string"
          ? record.title
          : undefined;
  const fieldErrors = extractFieldErrors(record);

  let code: AppErrorCode;
  switch (true) {
    case status === 400:
      code = "VALIDATION";
      break;
    case status === 401:
      code = "UNAUTHENTICATED";
      break;
    case status === 403:
      code = "FORBIDDEN";
      break;
    case status === 404:
      code = "NOT_FOUND";
      break;
    case status === 409:
      code = "CONFLICT";
      break;
    case status === 429:
      code = "RATE_LIMITED";
      break;
    case status >= 500:
      code = "SERVER_ERROR";
      break;
    default:
      code = "UNKNOWN";
  }

  return {
    status,
    code,
    message: backendMessage ?? DEFAULT_MESSAGES[code],
    ...(fieldErrors ? { fieldErrors } : {}),
    ...(process.env.NODE_ENV !== "production" ? { raw: body } : {}),
  };
}

/** Build an AppError for a non-HTTP failure (network down, aborted, timeout). */
export function mapNetworkError(error: unknown): AppError {
  const isTimeout = error instanceof DOMException && error.name === "AbortError";
  const code: AppErrorCode = isTimeout ? "TIMEOUT" : "OFFLINE";
  return {
    status: 0,
    code,
    message: DEFAULT_MESSAGES[code],
    ...(process.env.NODE_ENV !== "production" ? { raw: error } : {}),
  };
}

function extractFieldErrors(record: Record<string, unknown>): Record<string, string> | undefined {
  const source = record.errors ?? record.fieldErrors;
  if (typeof source !== "object" || source === null) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
    if (typeof value === "string") out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
