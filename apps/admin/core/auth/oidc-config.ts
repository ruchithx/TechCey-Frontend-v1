/**
 * OIDC configuration for Keycloak realm `ecommerce` (Authorization Code + PKCE).
 * Every value comes from env config — zero hardcoded issuer/client/redirect.
 *
 * Token storage: oidc-client-ts's default WebStorageStateStore backed by
 * sessionStorage (not localStorage) — a smaller XSS/persistence surface, at the
 * cost of re-authenticating in a brand-new tab. Silent refresh keeps the token
 * alive within a session.
 */

import type { AuthProviderProps } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";
import { env, getAuthPostLogoutUri, getAuthRedirectUri } from "@/core/config/env";

export function buildOidcConfig(): AuthProviderProps {
  return {
    authority: env.authIssuer,
    client_id: env.authClientId,
    redirect_uri: getAuthRedirectUri(),
    post_logout_redirect_uri: getAuthPostLogoutUri(),
    scope: env.authScope,
    response_type: "code",
    automaticSilentRenew: true,

    // Clean the ?code&state params off the URL after a successful signin callback.
    onSigninCallback: () => {
      window.history.replaceState({}, document.title, window.location.pathname);
    },

    // Keycloak redirects back to post_logout_redirect_uri with ?state=<x> (no code).
    // react-oidc-context only calls signoutCallback() if this returns true.
    matchSignoutCallback: () => {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get("state")) && !params.get("code") && !params.get("error");
    },

    // Clean ?state off the URL after signout completes.
    onSignoutCallback: () => {
      window.history.replaceState({}, document.title, window.location.pathname);
    },

    userStore:
      typeof window !== "undefined"
        ? new WebStorageStateStore({ store: window.sessionStorage })
        : undefined,
  };
}
