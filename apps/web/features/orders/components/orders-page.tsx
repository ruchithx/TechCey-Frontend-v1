"use client";

import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Card, CardContent } from "@repo/ui/components/card";
import { formatMoney, type OrderResponse } from "@/core/api";
import { useOrders } from "../services/useOrders";

type OrderStatus = OrderResponse["status"];

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "success" | "destructive" | "outline" | "warning"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  PAID: "success",
  CANCELLED: "outline",
  FAILED: "destructive",
};

function OrderCard({ order }: { order: OrderResponse }) {
  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-foreground">
                {order.orderNumber}
              </span>
              <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {date} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {order.items.map((i) => i.productName).join(", ")}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-tabular font-semibold text-foreground">
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
      </CardContent>
    </Card>
  );
}

export function OrderListPage() {
  const { data, isLoading, isError, error, refetch } = useOrders();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold text-foreground">My orders</h1>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex flex-col gap-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : data?.content.length === 0 ? (
        <div className="flex flex-col items-center gap-6 py-20 text-center">
          <Package className="size-14 text-muted-foreground/40" aria-hidden />
          <div>
            <p className="text-lg font-semibold text-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              When you make a purchase it will appear here.
            </p>
          </div>
          <Button asChild>
            <Link href="/products">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data?.content.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
