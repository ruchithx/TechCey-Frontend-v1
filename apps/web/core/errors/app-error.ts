/**
 * The single normalised error type for the whole app. Every failure path —
 * backend `ApiResponse` errors, product/cart bare `ApiError`, network failures,
 * timeouts — is mapped into an `AppError`. Feature code only ever sees this.
 */

export interface AppError {
  /** HTTP status, or 0 for a network / offline failure. */
  status: number;
  /** Machine-readable code, e.g. 'INSUFFICIENT_STOCK'. Switch on this, not the message. */
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
  | "INSUFFICIENT_STOCK"
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
  INSUFFICIENT_STOCK: "Not enough stock available for the requested quantity.",
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
 * `body` may be any of the three backend shapes:
 *   - order-service ErrorResponse: { success:false, message, errorCode?, errors? }
 *   - product/cart ApiError:       { error, message, status, ... }
 *   - a bare string / unknown
 */
export function mapHttpError(status: number, body: unknown): AppError {
  const record = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;

  // `message` — order/cart/product error shapes. `detail` — RFC 9457
  // `application/problem+json` from the shared `common` handler (user-service,
  // and order-service's ResponseStatusException path).
  const backendMessage =
    typeof record.message === "string"
      ? record.message
      : typeof record.detail === "string"
        ? record.detail
        : undefined;
  const backendCode =
    typeof record.errorCode === "string"
      ? record.errorCode
      : typeof record.code === "string"
        ? record.code
        : typeof record.error === "string"
          ? record.error
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
      // The stock case gets its own distinct code so the cart can show it inline.
      code = isStockConflict(backendCode, backendMessage) ? "INSUFFICIENT_STOCK" : "CONFLICT";
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
  const isTimeout =
    error instanceof DOMException && error.name === "AbortError";
  const code: AppErrorCode = isTimeout ? "TIMEOUT" : "OFFLINE";
  return {
    status: 0,
    code,
    message: DEFAULT_MESSAGES[code],
    ...(process.env.NODE_ENV !== "production" ? { raw: error } : {}),
  };
}

function isStockConflict(code: string | undefined, message: string | undefined): boolean {
  const haystack = `${code ?? ""} ${message ?? ""}`.toLowerCase();
  return haystack.includes("stock") || haystack.includes("insufficient");
}

function extractFieldErrors(record: Record<string, unknown>): Record<string, string> | undefined {
  const source = record.errors ?? record.fieldErrors;
  if (typeof source !== "object" || source === null) return undefined;
  const out: Record<string, string> = {};

  if (Array.isArray(source)) {
    // RFC 9457 shape from the shared `common` GlobalExceptionHandler:
    //   "errors": [ { "field": "firstName", "message": "must be 1..255" } ]
    for (const entry of source) {
      if (typeof entry !== "object" || entry === null) continue;
      const { field, message } = entry as Record<string, unknown>;
      if (typeof field === "string" && typeof message === "string") out[field] = message;
    }
  } else {
    // order-service ErrorResponse shape: { "firstName": "must be 1..255", ... }
    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
      if (typeof value === "string") out[key] = value;
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}
