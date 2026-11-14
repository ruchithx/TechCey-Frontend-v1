import { Badge } from "@repo/ui/components/badge";
import type { NotificationStatus, OrderStatus } from "@/core/api/types";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive" | "success" | "warning";

const NOTIFICATION_VARIANT: Record<NotificationStatus, BadgeVariant> = {
  PENDING: "secondary",
  SENDING: "secondary",
  SENT: "success",
  FAILED: "destructive",
  RETRYING: "warning",
  SUPPRESSED: "outline",
  CANCELLED: "outline",
};

const ORDER_VARIANT: Record<OrderStatus, BadgeVariant> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  PAID: "success",
  CANCELLED: "outline",
  FAILED: "destructive",
};

export function NotificationStatusBadge({ status }: { status: NotificationStatus }) {
  return <Badge variant={NOTIFICATION_VARIANT[status]}>{status}</Badge>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={ORDER_VARIANT[status]}>{status}</Badge>;
}
