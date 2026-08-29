"use client";

import { ExternalLink, KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { useAuth } from "@/core/auth";
import { getAccountConsoleUrl, getAccountSecurityUrl } from "@/core/config/env";

/**
 * Account & security. Passwords, two-factor and active sessions are owned by
 * Keycloak — the frontend never handles credentials. These links open Keycloak's
 * built-in Account Console (its supported self-service surface) in a new tab.
 * Sign out goes through the existing OIDC logout, untouched.
 */
export function AccountSecurity() {
  const { logout } = useAuth();

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <h2 className="font-display text-xl font-bold text-foreground">Account &amp; security</h2>

      <p className="text-sm text-muted-foreground">
        Your password, two-factor authentication and signed-in devices are managed by your sign-in
        provider (Keycloak), not by TechCey.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <a href={getAccountSecurityUrl()} target="_blank" rel="noreferrer noopener">
            <KeyRound className="size-4" />
            Change password
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={getAccountConsoleUrl()} target="_blank" rel="noreferrer noopener">
            <ShieldCheck className="size-4" />
            Manage sign-in &amp; sessions
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
        <Button variant="outline" onClick={() => logout()}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </section>
  );
}
