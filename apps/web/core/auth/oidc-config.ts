/**
 * OIDC configuration for Keycloak realm `ecommerce` (Authorization Code + PKCE).
 * Every value comes from env config — zero hardcoded issuer/client/redirect.
 *
 * Token storage: we use oidc-client-ts's default WebStorageStateStore backed by
 * **sessionStorage** (not localStorage). Tradeoff: tokens are cleared when the
 * tab closes and are not shared across tabs — a smaller XSS/persistence surface
 * than localStorage — at the cost of re-authenticating in a brand-new tab.
 * Silent refresh keeps the 15-min token alive within a session (see below).
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

    // 15-min access tokens => silent refresh is mandatory, not optional.
    // Code+PKCE issues a refresh token, so renewal is refresh-token based
    // (no hidden iframe needed).
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
