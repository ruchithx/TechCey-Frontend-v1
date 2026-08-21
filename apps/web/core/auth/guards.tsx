"use client";

/**
 * Route guards as wrapper components (the React equivalent of Angular's
 * functional route guards — see the brief Appendix).
 *
 *   <AuthGuard>            requires an authenticated user
 *   <RoleGuard roles={['ADMIN']}>  requires auth AND one of the given roles
 *
 * Wrap a page's content in the relevant guard. On failure, AuthGuard preserves
 * the attempted URL and redirects to login; RoleGuard shows a 403 surface.
 */

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/core/auth/use-auth";
import type { AppRole } from "@/core/auth/jwt";

function GuardLoading() {
  return (
    <div className="container-page flex min-h-[40vh] items-center justify-center text-muted-foreground">
      Checking access…
    </div>
  );
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login(pathname ?? "/");
    }
  }, [isLoading, isAuthenticated, login, pathname]);

  if (isLoading || !isAuthenticated) return <GuardLoading />;
  return <>{children}</>;
}

export function RoleGuard({ roles, children }: { roles: AppRole[]; children: ReactNode }) {
  const { isAuthenticated, isLoading, hasRole, login } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login(pathname ?? "/");
    }
  }, [isLoading, isAuthenticated, login, pathname]);

  if (isLoading || !isAuthenticated) return <GuardLoading />;

  const allowed = roles.some((role) => hasRole(role));
  if (!allowed) {
    return (
      <div className="container-page flex min-h-[40vh] flex-col items-center justify-center gap-2 py-16 text-center">
        <h1 className="text-2xl font-semibold text-foreground">403 — Forbidden</h1>
        <p className="text-muted-foreground">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }
  return <>{children}</>;
}
