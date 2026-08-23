"use client";

/** Real auth pages (not placeholders): /login, /signup and /callback. */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { useAuth, takeReturnTo } from "@/core/auth";

export function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace(takeReturnTo() ?? "/");
  }, [isAuthenticated, router]);

  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-xl font-semibold text-foreground">Sign in</h1>
        <p className="text-sm text-muted-foreground">Continue with your TechCey account.</p>
      </div>
      <Button onClick={() => login("/")} disabled={isLoading}>
        <LogIn aria-hidden />
        {isLoading ? "Loading…" : "Continue with Keycloak"}
      </Button>
      <p className="text-sm text-muted-foreground">
        New to TechCey?{" "}
        <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function SignupPage() {
  const { isAuthenticated, isLoading, signup } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace(takeReturnTo() ?? "/");
  }, [isAuthenticated, router]);

  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-xl font-semibold text-foreground">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Join TechCey to track orders, save your cart and check out faster.
        </p>
      </div>
      <Button onClick={() => signup("/")} disabled={isLoading}>
        <UserPlus aria-hidden />
        {isLoading ? "Loading…" : "Sign up with Keycloak"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function CallbackPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? (takeReturnTo() ?? "/") : "/login");
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
      <p>Signing you in…</p>
    </div>
  );
}
