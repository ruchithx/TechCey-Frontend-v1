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
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const returnTo = takeReturnTo();
      router.replace(returnTo && returnTo !== "/callback" ? returnTo : "/");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Signing you in…
    </div>
  );
}
