import type { ReactNode } from "react";
import Link from "next/link";

/** Admin shell: sidebar + content. Guarded by RoleGuard(['ADMIN']) at the page. */
export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-border bg-card p-4 md:flex">
        <Link href="/" className="mb-4 font-display text-lg font-bold tracking-tight text-foreground">
          Tech<span className="text-primary">Cey</span> <span className="text-muted-foreground">Admin</span>
        </Link>
        <Link href="/admin/products" className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
          Products
        </Link>
        <Link href="/admin/categories" className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
          Categories
        </Link>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
