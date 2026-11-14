"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, LogOut, Mail, Package, Shield, User } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { formatMoney, type OrderResponse } from "@/core/api";
import { useAuth } from "@/core/auth";
import { useOrders } from "@/features/orders";

/* --------------------------------- helpers --------------------------------- */

function initials(username: string): string {
  return username
    .split(/[\s._-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/* --------------------------------- profile --------------------------------- */

function ProfileCard() {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {/* avatar */}
          <div
            aria-hidden
            className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
          >
            {initials(currentUser.username) || <User className="size-8" />}
          </div>

          {/* info */}
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {currentUser.username}
              </h1>
              {currentUser.roles.map((role) => (
                <Badge key={role} variant={role === "ADMIN" ? "default" : "secondary"}>
                  {role}
                </Badge>
              ))}
            </div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-3.5" aria-hidden />
              {currentUser.email}
            </p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground/60">
              ID: {currentUser.id}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => logout()}
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ recent orders ----------------------------- */

type OrderStatus = OrderResponse["status"];

const STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "success" | "destructive" | "outline" | "warning"
> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  PAID: "success",
  CANCELLED: "outline",
  FAILED: "destructive",
};

function RecentOrderRow({ order }: { order: OrderResponse }) {
  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-foreground">
            {order.orderNumber}
          </span>
          <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {date} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-tabular text-sm font-semibold text-foreground">
          {formatMoney(order.totalAmount)}
        </span>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link href={`/orders/${order.id}`}>
            View
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function RecentOrdersSection() {
  const { data, isLoading, isError } = useOrders({ size: 3 });

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Recent orders</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/orders">
              All orders
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 py-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
        ) : isError || !data ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Could not load orders.
          </p>
        ) : data.content.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <Package className="size-10 text-muted-foreground/40" aria-hidden />
            <div>
              <p className="text-sm font-medium text-foreground">No orders yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your purchases will appear here.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/products">Start shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.content.map((order) => (
              <RecentOrderRow key={order.id} order={order} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ----------------------------- account details ---------------------------- */

function AccountDetailsSection() {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
          Account details
        </h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Username
            </dt>
            <dd className="text-sm text-foreground">{currentUser.username}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email address
            </dt>
            <dd className="text-sm text-foreground">{currentUser.email}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Roles
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              {currentUser.roles.map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {role}
                </Badge>
              ))}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-xs text-muted-foreground">
          Username and email are managed by your identity provider. To update them, use the
          Keycloak account portal.
        </p>
      </CardContent>
    </Card>
  );
}

/* -------------------------------- security --------------------------------- */

function SecuritySection() {
  const { logout } = useAuth();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-semibold text-foreground">Security</h2>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Password</p>
              <p className="text-xs text-muted-foreground">
                Managed via your identity provider.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <a
                href={`${process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? ""}/realms/ecommerce/account`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Manage
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </Button>
          </div>

          <div className="flex flex-col gap-1 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Sessions</p>
              <p className="text-xs text-muted-foreground">
                Sign out of your current session on this device.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0"
              onClick={() => logout()}
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------------------------- page ---------------------------------- */

export function AccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <ProfileCard />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* main column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <RecentOrdersSection />
        </div>

        {/* sidebar */}
        <div className="flex flex-col gap-6">
          <AccountDetailsSection />
          <SecuritySection />
        </div>
      </div>
    </div>
  );
}
