"use client";

import { useState } from "react";
import { Eye, RefreshCw, Send } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Select } from "@repo/ui/components/select";
import { cn } from "@repo/ui/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState, EmptyState } from "@/components/shared/data-state";
import { Pagination } from "@/components/shared/pagination";
import { NotificationStatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast";
import { getErrorMessage } from "@/components/shared/error-message";
import { formatDateTime } from "@/components/shared/format";
import { DEFAULT_PAGE_SIZE } from "@/core/config/constants";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  type NotificationChannel,
  type NotificationResponse,
  type NotificationStatus,
} from "@/core/api/types";
import {
  useFailedNotifications,
  useNotificationList,
  useRetryNotification,
} from "@/features/notifications/hooks";
import { SendNotificationDialog } from "@/features/notifications/send-notification-dialog";
import { NotificationDetailDialog } from "@/features/notifications/notification-detail-dialog";

type Tab = "all" | "failed";

export function NotificationsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(0);
  const [channel, setChannel] = useState<NotificationChannel | "">("");
  const [status, setStatus] = useState<NotificationStatus | "">("");
  const [userId, setUserId] = useState("");

  const [sendOpen, setSendOpen] = useState(false);
  const [detail, setDetail] = useState<NotificationResponse | null>(null);

  const retry = useRetryNotification();

  const allQuery = useNotificationList({
    channel: channel || undefined,
    status: status || undefined,
    userId: userId.trim() || undefined,
    page,
    size: DEFAULT_PAGE_SIZE,
  });
  const failedQuery = useFailedNotifications(page, DEFAULT_PAGE_SIZE);

  const query = tab === "all" ? allQuery : failedQuery;
  const rows = query.data?.content ?? [];

  function switchTab(next: Tab) {
    setTab(next);
    setPage(0);
  }

  async function onRetry(n: NotificationResponse) {
    try {
      await retry.mutateAsync(n.id);
      toast({ title: "Retry queued", description: n.templateCode, variant: "success" });
    } catch (error) {
      toast({ title: "Couldn't retry", description: getErrorMessage(error), variant: "destructive" });
    }
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Audit sent notifications, retry failures, and dispatch ad-hoc messages."
        actions={
          <Button onClick={() => setSendOpen(true)}>
            <Send className="size-4" /> Send notification
          </Button>
        }
      />

      <div className="mb-4 inline-flex rounded-md border p-0.5">
        {(["all", "failed"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "all" ? "All" : "Failed queue"}
          </button>
        ))}
      </div>

      {tab === "all" ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Select
            value={channel}
            onChange={(e) => {
              setChannel(e.target.value as NotificationChannel | "");
              setPage(0);
            }}
            className="sm:max-w-[10rem]"
          >
            <option value="">All channels</option>
            {NOTIFICATION_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as NotificationStatus | "");
              setPage(0);
            }}
            className="sm:max-w-[10rem]"
          >
            <option value="">All statuses</option>
            {NOTIFICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Input
            placeholder="Filter by user ID"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setPage(0);
            }}
            className="font-tabular sm:max-w-xs"
          />
        </div>
      ) : null}

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
        isEmpty={rows.length === 0}
        empty={<EmptyState title={tab === "failed" ? "No failed notifications" : "No notifications found"} />}
      >
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(n.createdAt)}
                  </TableCell>
                  <TableCell>{n.channel}</TableCell>
                  <TableCell className="font-tabular text-xs">{n.templateCode}</TableCell>
                  <TableCell className="text-muted-foreground">{n.recipient}</TableCell>
                  <TableCell>
                    <NotificationStatusBadge status={n.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {n.status === "FAILED" ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Retry"
                          disabled={retry.isPending}
                          onClick={() => onRetry(n)}
                        >
                          <RefreshCw className="size-4" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="View"
                        onClick={() => setDetail(n)}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4">
          <Pagination
            page={query.data?.page ?? 0}
            totalPages={query.data?.totalPages ?? 1}
            totalElements={query.data?.totalElements ?? rows.length}
            onChange={setPage}
          />
        </div>
      </QueryState>

      <SendNotificationDialog open={sendOpen} onOpenChange={setSendOpen} />
      <NotificationDetailDialog notification={detail} onOpenChange={(o) => !o && setDetail(null)} />
    </div>
  );
}
