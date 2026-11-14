"use client";

/**
 * AuthService as a hook. The app's single auth surface: everything else reads
 * from here rather than touching react-oidc-context directly.
 *
 * Exposes (the D3.4 contract):
 *   isAuthenticated, isLoading, currentUser {id,username,email,roles},
 *   hasRole(role), login(returnTo?), logout()
 */

import { useMemo, useCallback } from "react";
import { useAuth as useOidcAuth } from "react-oidc-context";
import { currentUserFromToken, type AppRole, type CurrentUser } from "@/core/auth/jwt";

const RETURN_TO_KEY = "techcey.auth.returnTo";

export interface AuthApi {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: CurrentUser | null;
  hasRole: (role: AppRole) => boolean;
  login: (returnTo?: string) => void;
  signup: (returnTo?: string) => void;
  logout: () => void;
}

export function useAuth(): AuthApi {
  const oidc = useOidcAuth();

  const currentUser = useMemo(
    () => currentUserFromToken(oidc.user?.access_token),
    [oidc.user?.access_token],
  );

  const hasRole = useCallback(
    (role: AppRole) => currentUser?.roles.includes(role) ?? false,
    [currentUser],
  );

  const preserveReturnTo = useCallback((returnTo?: string) => {
    // Preserve the attempted URL so 401 handling / guards can return the user
    // to where they were (D3.6).
    if (returnTo && typeof window !== "undefined") {
      window.sessionStorage.setItem(RETURN_TO_KEY, returnTo);
    }
  }, []);

  const login = useCallback(
    (returnTo?: string) => {
      preserveReturnTo(returnTo);
      void oidc.signinRedirect();
    },
    [oidc, preserveReturnTo],
  );

  const signup = useCallback(
    (returnTo?: string) => {
      preserveReturnTo(returnTo);
      // Same Authorization Code + PKCE flow as login, but sent straight to
      // Keycloak's registration form via the standard OIDC `prompt=create`
      // param (Initiating User Registration draft; supported by Keycloak
      // 26.x). No separate client, endpoint, or credential handling here —
      // Keycloak still owns account creation.
      void oidc.signinRedirect({ prompt: "create" });
    },
    [oidc, preserveReturnTo],
  );

  const logout = useCallback(() => {
    void oidc.signoutRedirect();
  }, [oidc]);

  return {
    isAuthenticated: oidc.isAuthenticated,
    isLoading: oidc.isLoading,
    currentUser,
    hasRole,
    login,
    signup,
    logout,
  };
}

/** Read + clear the preserved post-login return path. */
export function takeReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(RETURN_TO_KEY);
  if (value) window.sessionStorage.removeItem(RETURN_TO_KEY);
  return value;
}

export const RETURN_TO_STORAGE_KEY = RETURN_TO_KEY;
