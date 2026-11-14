"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { NotificationStatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/components/shared/format";
import type { NotificationResponse } from "@/core/api/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 break-words text-foreground">{value || "—"}</dd>
    </div>
  );
}

export function NotificationDetailDialog({
  notification,
  onOpenChange,
}: {
  notification: NotificationResponse | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(notification)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Notification detail</DialogTitle>
        </DialogHeader>
        {notification ? (
          <dl className="divide-y">
            <Row label="Status" value={<NotificationStatusBadge status={notification.status} />} />
            <Row label="Channel" value={notification.channel} />
            <Row label="Template" value={notification.templateCode} />
            <Row label="Recipient" value={notification.recipient} />
            <Row label="Subject" value={notification.subject} />
            <Row
              label="Body"
              value={
                <span className="whitespace-pre-wrap">
                  {notification.body || notification.bodyPreview}
                </span>
              }
            />
            <Row
              label="Reference"
              value={
                notification.referenceType
                  ? `${notification.referenceType}${notification.referenceId ? `:${notification.referenceId}` : ""}`
                  : "—"
              }
            />
            <Row label="Sent" value={formatDateTime(notification.sentAt)} />
            <Row label="Created" value={formatDateTime(notification.createdAt)} />
            <Row label="ID" value={<span className="font-tabular text-xs">{notification.id}</span>} />
          </dl>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
