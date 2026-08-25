/**
 * Minimal JWT claim decoding. We only READ claims for UI purposes (roles, name);
 * the gateway is the sole authority that VALIDATES the token. Never trust these
 * claims for security decisions on the client.
 *
 * Roles live in `realm_access.roles[]` (Keycloak realm-access claim on the
 * access token). Admin authorization is the realm role `ADMIN` (case-sensitive).
 */

export type AppRole = "ADMIN" | "CUSTOMER";

export interface CurrentUser {
  id: string; // JWT `sub` (UUID)
  username: string;
  email: string;
  roles: AppRole[];
}

interface KeycloakAccessClaims {
  sub?: string;
  preferred_username?: string;
  email?: string;
  realm_access?: { roles?: string[] };
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  if (typeof atob === "function") return atob(padded);
  return Buffer.from(padded, "base64").toString("binary");
}

/** Decode a JWT payload without verifying the signature. Returns null on any failure. */
export function decodeJwt<T = Record<string, unknown>>(token: string | undefined): T | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const json = decodeURIComponent(
      base64UrlDecode(parts[1])
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** Build the CurrentUser view-model from a raw access token. */
export function currentUserFromToken(accessToken: string | undefined): CurrentUser | null {
  const claims = decodeJwt<KeycloakAccessClaims>(accessToken);
  if (!claims?.sub) return null;
  const roles = (claims.realm_access?.roles ?? []).filter(
    (r): r is AppRole => r === "ADMIN" || r === "CUSTOMER",
  );
  return {
    id: claims.sub,
    username: claims.preferred_username ?? "",
    email: claims.email ?? "",
    roles,
  };
}
