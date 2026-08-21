"use client";

/**
 * App header. Contains SLOTS, not feature implementations:
 *   - logo / home link
 *   - search-input slot (filled by the catalog feature later)
 *   - cart-badge slot (filled by the cart feature later)
 *   - account menu, driven by useAuth().hasRole
 *   - a working mobile drawer
 *
 * The cart badge and search box are intentionally empty outlets here.
 */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Menu, ShoppingCart, X } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { useAuth } from "@/core/auth";

/** Outlet a feature fills later (e.g. cart badge count, search input). */
function Slot({ id, children }: { id: string; children?: ReactNode }) {
  return (
    <div data-slot={id} className="contents">
      {children}
    </div>
  );
}

function AccountMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { isAuthenticated, currentUser, hasRole, login, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <Button size="sm" onClick={() => login("/account")}>
        Sign in
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/orders" className="text-muted-foreground hover:text-foreground" onClick={onNavigate}>
        Orders
      </Link>
      <Link href="/account" className="text-muted-foreground hover:text-foreground" onClick={onNavigate}>
        {currentUser?.username || "Account"}
      </Link>
      {hasRole("ADMIN") ? (
        <Link href="/admin/products" className="text-muted-foreground hover:text-foreground" onClick={onNavigate}>
          Admin
        </Link>
      ) : null}
      <Button variant="outline" size="sm" onClick={() => logout()}>
        Sign out
      </Button>
    </div>
  );
}

export function SiteHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-sticky border-b border-border bg-background/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-foreground">
          Tech<span className="text-primary">Cey</span>
        </Link>

        {/* search slot — filled by catalog feature */}
        <div className="hidden flex-1 md:block">
          <Slot id="header-search" />
        </div>

        <nav className="ml-auto hidden items-center gap-4 md:flex">
          <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
            Products
          </Link>
          <Link href="/cart" className="relative inline-flex items-center text-muted-foreground hover:text-foreground" aria-label="Cart">
            <ShoppingCart className="size-5" />
            <Slot id="cart-badge" />
          </Link>
          <AccountMenu />
        </nav>

        {/* mobile trigger */}
        <button
          type="button"
          className="ml-auto inline-flex size-9 items-center justify-center rounded-md text-foreground md:hidden"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-modal md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col gap-4 bg-card p-6 shadow-e3">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-foreground">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                className="inline-flex size-9 items-center justify-center rounded-md text-foreground"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <Link href="/products" className="text-foreground" onClick={() => setDrawerOpen(false)}>
              Products
            </Link>
            <Link href="/cart" className="text-foreground" onClick={() => setDrawerOpen(false)}>
              Cart
            </Link>
            <AccountMenu onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}
    </header>
  );
}
