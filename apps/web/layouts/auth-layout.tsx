import type { ReactNode } from "react";
import Link from "next/link";

/** Minimal shell for /login and /callback. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6">
      <Link href="/" className="font-display text-2xl font-bold tracking-tight text-foreground">
        Tech<span className="text-primary">Cey</span>
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-e2">
        {children}
      </div>
    </div>
  );
}
