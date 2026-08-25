"use client";

/**
 * Route guard as a wrapper component. The admin console is ADMIN-only end to
 * end, so a single <RoleGuard roles={['ADMIN']}> at the app shell protects every
 * page. On failure it either preserves the attempted URL and redirects to login
 * (unauthenticated) or renders a 403 surface (authenticated non-admin).
 */

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { useAuth } from "@/core/auth/use-auth";
import type { AppRole } from "@/core/auth/jwt";

function GuardLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      {label}
    </div>
  );
}

export function RoleGuard({ roles, children }: { roles: AppRole[]; children: ReactNode }) {
  const { isAuthenticated, isLoading, hasRole, login, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login(pathname ?? "/");
    }
  }, [isLoading, isAuthenticated, login, pathname]);

  if (isLoading) return <GuardLoading label="Checking access…" />;
  if (!isAuthenticated) return <GuardLoading label="Redirecting to sign in…" />;

  const allowed = roles.some((role) => hasRole(role));
  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">403 — Admins only</h1>
        <p className="max-w-md text-muted-foreground">
          Your account is signed in but does not have the <code>ADMIN</code> role required to use
          the operations console.
        </p>
        <Button variant="outline" onClick={logout}>
          Switch account
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}
