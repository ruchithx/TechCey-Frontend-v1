"use client";

import Link from "next/link";
import {
  Bell,
  FileText,
  Package,
  ShoppingCart,
  Star,
  Tags,
  TriangleAlert,
  Warehouse,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/core/auth";
import { useProductList } from "@/features/products/hooks";
import { useCategoryList } from "@/features/categories/hooks";
import { useLowStock } from "@/features/inventory/hooks";
import { useFailedNotifications } from "@/features/notifications/hooks";

function StatCard({
  href,
  label,
  value,
  icon: Icon,
  loading,
  tone = "default",
}: {
  href: string;
  label: string;
  value: number | string;
  icon: typeof Package;
  loading?: boolean;
  tone?: "default" | "warning" | "destructive";
}) {
  const toneClass =
    tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-primary";
  return (
    <Link href={href} className="group">
      <Card className="gap-3 py-4 transition-colors group-hover:border-primary/40">
        <CardHeader className="px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <Icon className={`size-4 ${toneClass}`} />
          </div>
        </CardHeader>
        <CardContent className="px-4">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="font-tabular text-3xl font-semibold text-foreground">{value}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Package;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border p-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
    >
      <Icon className="size-4 text-muted-foreground" />
      {label}
    </Link>
  );
}

export function DashboardPage() {
  const { currentUser } = useAuth();

  const products = useProductList({ page: 0, size: 1 });
  const categories = useCategoryList();
  const lowStock = useLowStock();
  const failed = useFailedNotifications(0, 1);

  return (
    <div>
      <PageHeader
        title={`Welcome${currentUser?.username ? `, ${currentUser.username}` : ""}`}
        description="Operations at a glance. Jump into any area from the cards below."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          href="/products"
          label="Products"
          icon={Package}
          loading={products.isLoading}
          value={products.data?.totalElements ?? "—"}
        />
        <StatCard
          href="/categories"
          label="Categories"
          icon={Tags}
          loading={categories.isLoading}
          value={categories.data?.length ?? "—"}
        />
        <StatCard
          href="/inventory"
          label="Low stock"
          icon={TriangleAlert}
          tone="warning"
          loading={lowStock.isLoading}
          value={lowStock.data?.length ?? "—"}
        />
        <StatCard
          href="/notifications"
          label="Failed notifications"
          icon={Bell}
          tone="destructive"
          loading={failed.isLoading}
          value={failed.data?.totalElements ?? "—"}
        />
      </div>

      <h2 className="mt-8 mb-3 text-sm font-medium text-foreground">Manage</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <QuickLink href="/products" label="Products" icon={Package} />
        <QuickLink href="/categories" label="Categories" icon={Tags} />
        <QuickLink href="/inventory" label="Inventory" icon={Warehouse} />
        <QuickLink href="/orders" label="Orders" icon={ShoppingCart} />
        <QuickLink href="/notifications" label="Notifications" icon={Bell} />
        <QuickLink href="/templates" label="Templates" icon={FileText} />
        <QuickLink href="/reviews" label="Reviews" icon={Star} />
      </div>
    </div>
  );
}
