"use client";

/**
 * Auth provider. Wraps react-oidc-context and wires it into the rest of the app:
 *   - registers the bearer-token provider with the HTTP layer
 *   - registers the 401 handler: try ONE silent refresh, then redirect to login
 *
 * It mounts the OIDC provider client-side only (oidc-client-ts touches window),
 * showing a lightweight loader during the first paint.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AuthProvider as OidcAuthProvider, useAuth as useOidcAuth } from "react-oidc-context";
import { registerAuthTokenProvider, registerUnauthorizedHandler } from "@/core/api/http";
import { buildOidcConfig } from "@/core/auth/oidc-config";

function AuthBridge() {
  const oidc = useOidcAuth();
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = oidc.user?.access_token ?? null;

  // Token provider: HTTP layer reads the freshest token synchronously.
  useEffect(() => {
    registerAuthTokenProvider(() => tokenRef.current);
  }, []);

  // 401 handling: one silent refresh, then fall back to login.
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      oidc.signinSilent().catch(() => {
        void oidc.signinRedirect();
      });
    });
  }, [oidc]);

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <OidcAuthProvider {...buildOidcConfig()}>
      <AuthBridge />
      {children}
    </OidcAuthProvider>
  );
}
