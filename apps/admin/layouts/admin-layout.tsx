"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Warehouse,
  ShoppingCart,
  Bell,
  FileText,
  Star,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { useAuth } from "@/core/auth";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/inventory", label: "Inventory", icon: Warehouse },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/reviews", label: "Reviews", icon: Star },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { currentUser, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/" className="flex items-center gap-2 px-1 py-2 text-lg font-bold tracking-tight">
      <span className="text-foreground">
        Tech<span className="text-primary">Cey</span>
      </span>
      <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-accent-foreground">
        ADMIN
      </span>
    </Link>
  );

  const userBar = (
    <div className="border-t pt-3">
      <div className="px-1">
        <p className="truncate text-sm font-medium text-foreground">
          {currentUser?.username || "Admin"}
        </p>
        <p className="truncate text-xs text-muted-foreground">{currentUser?.email}</p>
      </div>
      <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={logout}>
        <LogOut className="size-4" /> Sign out
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-2 border-r bg-card p-4 md:flex">
        {brand}
        {nav}
        {userBar}
      </aside>

      {/* Mobile off-canvas */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-modal flex md:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-64 flex-col gap-2 border-r bg-card p-4">
            {brand}
            {nav}
            {userBar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          {brand}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
