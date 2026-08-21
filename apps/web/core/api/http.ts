/**
 * The one HTTP client every hook/service uses. Responsibilities:
 *   - prefix relative paths with the gateway base URL
 *   - attach `Authorization: Bearer <token>` to GATEWAY requests only
 *   - unwrap the response envelope transparently
 *   - map every failure into a typed AppError
 *   - enforce a request timeout
 *
 * It knows nothing about auth internals: auth registers a token provider and an
 * unauthorized handler via the seams below. This avoids a core/api -> core/auth
 * dependency (which the D5 boundary rules also forbid at the feature level).
 */

import { env } from "@/core/config/env";
import { unwrapEnvelope } from "@/core/api/envelope";
import { mapHttpError, mapNetworkError, type AppError } from "@/core/errors/app-error";

const DEFAULT_TIMEOUT_MS = 15_000;

/* ----------------------------- auth seams ----------------------------- */

let tokenProvider: () => string | null = () => null;
let unauthorizedHandler: () => void = () => {};

/** Auth calls this once at startup so requests can carry the bearer token. */
export function registerAuthTokenProvider(provider: () => string | null): void {
  tokenProvider = provider;
}

/** Auth calls this once so a 401 can trigger refresh/login centrally (D3.6). */
export function registerUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

/* ------------------------------ request ------------------------------- */

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Query params; undefined/null values are dropped. */
  params?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

/**
 * `path` must be a gateway path from ENDPOINTS (starts with '/'). Absolute URLs
 * are treated as third-party: they are fetched WITHOUT the bearer token.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const isGatewayRequest = path.startsWith("/");
  const url = buildUrl(path, params);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  // Attach the bearer token to gateway requests only — never to third parties.
  if (isGatewayRequest) {
    const token = tokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const signal = options.signal
    ? anySignal([options.signal, controller.signal])
    : controller.signal;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    throw mapNetworkError(error);
  }
  clearTimeout(timeout);

  const payload = await parseBody(response);

  if (!response.ok) {
    const appError: AppError = mapHttpError(response.status, payload);
    if (appError.status === 401) unauthorizedHandler();
    throw appError;
  }

  return unwrapEnvelope(payload, response.status) as T;
}

/* ------------------------------ helpers ------------------------------- */

function buildUrl(
  path: string,
  params?: RequestOptions["params"],
): string {
  const base = path.startsWith("/") ? `${env.apiBaseUrl}${path}` : path;
  if (!params) return base;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Combine multiple AbortSignals (caller signal + timeout signal). */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller.signal;
}
