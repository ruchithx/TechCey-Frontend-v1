"use client";

/**
 * AuthService as a hook. The app's single auth surface: everything else reads
 * from here rather than touching react-oidc-context directly.
 */

import { useMemo, useCallback } from "react";
import { useAuth as useOidcAuth } from "react-oidc-context";
import { currentUserFromToken, type AppRole, type CurrentUser } from "@/core/auth/jwt";

const RETURN_TO_KEY = "techcey.admin.returnTo";

export interface AuthApi {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | undefined;
  currentUser: CurrentUser | null;
  hasRole: (role: AppRole) => boolean;
  login: (returnTo?: string) => void;
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

  const login = useCallback(
    (returnTo?: string) => {
      if (returnTo && typeof window !== "undefined") {
        window.sessionStorage.setItem(RETURN_TO_KEY, returnTo);
      }
      void oidc.signinRedirect();
    },
    [oidc],
  );

  const logout = useCallback(() => {
    void oidc.signoutRedirect();
  }, [oidc]);

  return {
    isAuthenticated: oidc.isAuthenticated,
    isLoading: oidc.isLoading,
    error: oidc.error,
    currentUser,
    hasRole,
    login,
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
