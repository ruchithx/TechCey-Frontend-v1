"use client";

import { Bell, BellOff } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Skeleton } from "@repo/ui/components/skeleton";
import { ErrorState, EmptyState } from "@/components/shared/data-state";
import { useMarkNotificationRead, useNotificationList } from "../services/useNotifications";

export function NotificationList() {
  const query = useNotificationList({ page: 0, size: 10 });
  const markRead = useMarkNotificationRead();

  const notifications = query.data?.content ?? [];

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />;
  if (notifications.length === 0) {
    return <EmptyState title="No notifications" description="You're all caught up." icon={<BellOff className="size-8" />} />;
  }

  return (
    <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
      {notifications.map((n) => (
        <li
          key={n.id}
          className="flex items-start gap-3 p-3 cursor-pointer"
          onClick={() => !n.readAt && markRead.mutate(n.id)}
        >
          <Bell className={n.readAt ? "mt-0.5 size-4 text-muted-foreground" : "mt-0.5 size-4 text-primary"} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-foreground">{n.subject}</p>
              {!n.readAt ? <Badge variant="default">New</Badge> : null}
            </div>
            {n.bodyPreview ? <p className="truncate text-xs text-muted-foreground">{n.bodyPreview}</p> : null}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {new Date(n.createdAt).toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  );
}
