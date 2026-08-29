"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PackageX } from "lucide-react";
import { Select } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { formatMoney, ORDER_STATUSES } from "@/core/api";
import { QueryState, EmptyState } from "@/components/shared/data-state";
import { Pagination } from "@/components/shared/pagination";
import { useOrderList } from "../services/useOrders";
import { OrderStatusBadge } from "./order-status-badge";

export function OrderListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const page = Number(searchParams.get("page") ?? 0);

  function setParams(next: { status?: string; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    const merged = { status, page, ...next };
    if (merged.status) params.set("status", merged.status);
    else params.delete("status");
    const nextPage = next.page !== undefined ? next.page : 0;
    if (nextPage > 0) params.set("page", String(nextPage));
    else params.delete("page");
    router.push(`/orders?${params.toString()}`);
  }

  const query = useOrderList({
    status: status ? (status as (typeof ORDER_STATUSES)[number]) : undefined,
    page,
    size: 20,
  });

  const orders = query.data?.content ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Your orders</h1>
        <Select
          value={status}
          onChange={(e) => setParams({ status: e.target.value })}
          className="max-w-[200px]"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </Select>
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
        isEmpty={orders.length === 0}
        skeleton={
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        }
        empty={
          <EmptyState
            title="No orders yet"
            description="Orders you place will show up here."
            icon={<PackageX className="size-8" />}
          />
        }
      >
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-secondary"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item
                    {order.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-tabular font-semibold text-foreground">
                    {formatMoney(order.totalAmount)}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <Pagination
          page={query.data?.page ?? 0}
          totalPages={query.data?.totalPages ?? 1}
          totalElements={query.data?.totalElements ?? orders.length}
          onChange={(nextPage) => setParams({ page: nextPage })}
        />
      </QueryState>
    </div>
  );
}
