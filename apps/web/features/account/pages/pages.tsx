"use client";

import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { ProfileCard } from "../components/profile-card";
import { AddressList } from "../components/address-list";
import { AccountSecurity } from "../components/account-security";
import { NotificationList } from "../components/notification-list";

/**
 * The authenticated customer's "My Account" area. Customer self-service only —
 * admin user management lives in a separate app. Every section reads live from
 * the real backend; identity fields that Keycloak owns are shown read-only.
 */
export function AccountPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Your account</h1>

      <ProfileCard />

      <AddressList />

      <AccountSecurity />

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <h2 className="font-display text-xl font-bold text-foreground">Orders</h2>
        <p className="text-sm text-muted-foreground">
          Track current orders and review everything you&apos;ve bought.
        </p>
        <div>
          <Button asChild variant="outline">
            <Link href="/orders">
              <Package className="size-4" />
              View orders
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <NotificationList />
    </div>
  );
}
