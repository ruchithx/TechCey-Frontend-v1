"use client";

/**
 * OIDC redirect landing page. react-oidc-context processes the ?code&state in
 * the URL automatically (see oidc-config onSigninCallback). Once authenticated
 * we bounce to the preserved return path, or the dashboard.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, takeReturnTo } from "@/core/auth";

export default function CallbackPage() {
  const { isAuthenticated, isLoading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      const returnTo = takeReturnTo();
      router.replace(returnTo && returnTo !== "/callback" ? returnTo : "/");
      return;
    }

    // Callback failed or no auth params — go to root so RoleGuard re-triggers login.
    router.replace("/");
  }, [isAuthenticated, isLoading, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Authentication error: {error.message}. Redirecting…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Signing you in…
    </div>
  );
}
