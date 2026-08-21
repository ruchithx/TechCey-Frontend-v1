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
   * ⚠️ NEEDS VERIFICATION (see FRONTEND_DEVELOPER_GUIDE.md → Blockers).
   * The realm currently ships a `gateway-client`. A browser SPA needs a PUBLIC
   * client with PKCE, this app's origin in Valid Redirect URIs + Web Origins.
   * If no such client exists, one (e.g. `techcey-spa`) must be added to the
   * backend's keycloak/ecommerce-realm.json. We do NOT edit the backend repo.
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
