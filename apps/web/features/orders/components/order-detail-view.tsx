"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Button } from "@repo/ui/components/button";
import { formatMoney } from "@/core/api";
import { ErrorState } from "@/components/shared/data-state";
import { useToast } from "@/components/shared/toast";
import { getErrorMessage } from "@/components/shared/error-message";
import { useCancelOrder, useOrder } from "../services/useOrders";
import { OrderStatusBadge } from "./order-status-badge";

export function OrderDetailView() {
  const params = useParams<{ id: string }>();
  const orderQuery = useOrder(params.id);
  const cancelOrder = useCancelOrder();
  const { toast } = useToast();

  if (orderQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (orderQuery.isError) return <ErrorState error={orderQuery.error} onRetry={orderQuery.refetch} />;
  const order = orderQuery.data;
  if (!order) return null;

  async function handleCancel() {
    try {
      await cancelOrder.mutateAsync(order!.id);
      toast({ title: "Order cancelled", variant: "success" });
    } catch (error) {
      toast({ title: "Couldn't cancel order", description: getErrorMessage(error), variant: "destructive" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{item.productName}</p>
                  <p className="font-tabular text-xs text-muted-foreground">
                    {formatMoney(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <span className="font-tabular font-semibold text-foreground">{formatMoney(item.subtotal)}</span>
              </li>
            ))}
          </ul>

          {order.notes ? (
            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              <p className="font-medium text-foreground">Notes</p>
              <p className="text-muted-foreground">{order.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="flex h-fit flex-col gap-4 rounded-lg border border-border bg-card p-4">
          <div>
            <p className="font-medium text-foreground">Shipping address</p>
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
              <br />
              {order.shippingAddress.country}
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4 text-base font-semibold text-foreground">
            <span>Total</span>
            <span className="font-tabular">{formatMoney(order.totalAmount)}</span>
          </div>
          {order.status === "PENDING" ? (
            <Button variant="outline" onClick={handleCancel} disabled={cancelOrder.isPending}>
              {cancelOrder.isPending ? "Cancelling…" : "Cancel order"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
