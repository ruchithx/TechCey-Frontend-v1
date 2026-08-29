/**
 * Central environment configuration. The ONLY place that reads process.env.
 *
 * All values are public (browser-exposed) and therefore use the NEXT_PUBLIC_
 * prefix required by Next.js. Nothing secret belongs here — this is a public SPA.
 *
 * Override any value via apps/web/.env.local (see .env.example).
 */

function readEnv(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

export const env = {
  /**
   * API Gateway base URL. The frontend talks ONLY to the gateway — never to an
   * individual service port. Standardising path prefixes is handled in
   * core/api/endpoints.ts, not here.
   */
  apiBaseUrl: readEnv(process.env.NEXT_PUBLIC_API_BASE_URL, "http://localhost:8085"),

  /**
   * Keycloak OIDC issuer for realm `ecommerce`.
   * e.g. http://localhost:8080/realms/ecommerce
   */
  authIssuer: readEnv(
    process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER,
    "http://localhost:8080/realms/ecommerce",
  ),

  /**
   * Public SPA client id (Authorization Code + PKCE).
   *
   * Verified against keycloak/ecommerce-realm.json (TechCey-Backend, 2026-08-27):
   * `techcey-spa` exists, is a public client with PKCE (S256), and has
   * redirectUris/webOrigins set to http://localhost:3000 — matches this app.
   */
  authClientId: readEnv(process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID, "techcey-spa"),

  /** OIDC scopes requested at login. */
  authScope: readEnv(process.env.NEXT_PUBLIC_KEYCLOAK_SCOPE, "openid profile email"),

  /**
   * Toggle MSW mock backend. Defaults ON in development, and a build-time guard
   * (core/config/msw-guard.ts) hard-fails if this is truthy in a production build.
   */
  enableMsw:
    readEnv(
      process.env.NEXT_PUBLIC_ENABLE_MSW,
      process.env.NODE_ENV === "development" ? "true" : "false",
    ) === "true",

  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
} as const;

/**
 * Keycloak's built-in Account Console for realm `ecommerce`, derived from the
 * OIDC issuer. This is where password, two-factor, active sessions and device
 * activity are managed — the frontend NEVER handles credentials itself, it just
 * links the customer to Keycloak's supported self-service surface.
 *
 * `accountConsoleUrl` is the console home; `accountSecurityUrl` deep-links to the
 * "Signing in" (password / 2FA) page.
 */
export function getAccountConsoleUrl(): string {
  return `${env.authIssuer.replace(/\/$/, "")}/account`;
}

export function getAccountSecurityUrl(): string {
  return `${getAccountConsoleUrl()}/#/security/signingin`;
}

/**
 * Runtime auth URIs depend on the browser origin, so they are resolved lazily
 * (window is undefined during SSR / build).
 */
export function getAuthRedirectUri(): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  return `${origin}/callback`;
}

export function getAuthPostLogoutUri(): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  return `${origin}/`;
}
