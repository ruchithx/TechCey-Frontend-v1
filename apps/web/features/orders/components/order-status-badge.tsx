import { Badge } from "@repo/ui/components/badge";
import type { OrderStatus } from "@/core/api";

const VARIANT: Record<OrderStatus, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  PENDING: "secondary",
  AWAITING_PAYMENT: "warning",
  CONFIRMED: "default",
  PAID: "success",
  CANCELLED: "secondary",
  FAILED: "destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANT[status]}>{status.replace("_", " ")}</Badge>;
}
