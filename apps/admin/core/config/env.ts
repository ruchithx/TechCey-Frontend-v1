/**
 * Central environment configuration for the admin console. The ONLY place that
 * reads process.env.
 *
 * All values are public (browser-exposed) and therefore use the NEXT_PUBLIC_
 * prefix required by Next.js. Nothing secret belongs here — this is a public SPA
 * that talks only to the gateway.
 *
 * Override any value via apps/admin/.env.local (see .env.example).
 */

function readEnv(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

const DEV_ORIGIN = "http://localhost:3001";

export const env = {
  /**
   * API Gateway base URL. The admin console talks ONLY to the gateway — never to
   * an individual service port. Path prefixes are handled in
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

  /** Public SPA client id (Authorization Code + PKCE). Shared with the storefront. */
  authClientId: readEnv(process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID, "techcey-spa"),

  /** OIDC scopes requested at login. */
  authScope: readEnv(process.env.NEXT_PUBLIC_KEYCLOAK_SCOPE, "openid profile email"),

  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
} as const;

/**
 * Runtime auth URIs depend on the browser origin, so they are resolved lazily
 * (window is undefined during SSR / build).
 */
export function getAuthRedirectUri(): string {
  const origin = typeof window !== "undefined" ? window.location.origin : DEV_ORIGIN;
  return `${origin}/callback`;
}

export function getAuthPostLogoutUri(): string {
  const origin = typeof window !== "undefined" ? window.location.origin : DEV_ORIGIN;
  return `${origin}/`;
}
