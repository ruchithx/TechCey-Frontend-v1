"use client";

import { Bell, BellOff, CheckCheck } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { ErrorState, EmptyState } from "@/components/shared/data-state";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationList,
  useUnreadNotificationCount,
} from "../services/useNotifications";

export function NotificationList() {
  const query = useNotificationList({ page: 0, size: 10 });
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = query.data?.content ?? [];
  const unreadCount = unread.data ?? 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-foreground">
          Notifications
          {unreadCount > 0 ? (
            <Badge variant="default" className="ml-2 align-middle">
              {unreadCount} new
            </Badge>
          ) : null}
        </h2>
        {unreadCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="size-4" />
            {markAllRead.isPending ? "Marking…" : "Mark all read"}
          </Button>
        ) : null}
      </div>

      {query.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You're all caught up."
          icon={<BellOff className="size-8" />}
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={n.readAt ? "flex items-start gap-3 p-3" : "flex items-start gap-3 p-3 cursor-pointer"}
              onClick={() => !n.readAt && markRead.mutate(n.id)}
            >
              <Bell
                className={n.readAt ? "mt-0.5 size-4 text-muted-foreground" : "mt-0.5 size-4 text-primary"}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{n.subject}</p>
                  {!n.readAt ? <Badge variant="default">New</Badge> : null}
                </div>
                {n.bodyPreview ? (
                  <p className="truncate text-xs text-muted-foreground">{n.bodyPreview}</p>
                ) : null}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(n.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
