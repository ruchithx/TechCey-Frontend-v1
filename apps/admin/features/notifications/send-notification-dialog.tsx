"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Select } from "@repo/ui/components/select";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/components/shared/toast";
import { applyFieldErrors } from "@/components/shared/apply-field-errors";
import { getErrorMessage } from "@/components/shared/error-message";
import { isAppError } from "@/core/errors/app-error";
import { NOTIFICATION_CHANNELS, type SendNotificationRequest } from "@/core/api/types";
import { useSendNotification } from "@/features/notifications/hooks";
import {
  parseVariables,
  sendNotificationSchema,
  type SendNotificationValues,
} from "@/features/notifications/schema";

const EMPTY: SendNotificationValues = {
  channel: "EMAIL",
  templateCode: "",
  userId: "",
  recipient: "",
  locale: "",
  priority: "",
  referenceType: "",
  referenceId: "",
  variablesJson: "",
};

export function SendNotificationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const send = useSendNotification();
  const form = useForm<SendNotificationValues>({
    resolver: zodResolver(sendNotificationSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) form.reset(EMPTY);
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const body: SendNotificationRequest = {
      channel: values.channel,
      templateCode: values.templateCode.trim(),
      userId: values.userId?.trim() || undefined,
      recipient: values.recipient?.trim() || undefined,
      locale: values.locale?.trim() || undefined,
      priority: values.priority?.trim() ? Number(values.priority) : undefined,
      referenceType: values.referenceType?.trim() || undefined,
      referenceId: values.referenceId?.trim() || undefined,
      variables: parseVariables(values.variablesJson),
    };
    try {
      await send.mutateAsync(body);
      toast({ title: "Notification queued", description: `Template ${body.templateCode}`, variant: "success" });
      onOpenChange(false);
    } catch (error) {
      if (isAppError(error) && error.status === 404) {
        form.setError("templateCode", { type: "server", message: "Template not found" });
        return;
      }
      if (isAppError(error) && error.status === 429) {
        toast({ title: "Rate limited", description: "This user has hit the send limit — try again later.", variant: "destructive" });
        return;
      }
      if (!applyFieldErrors(error, form.setError, ["channel", "templateCode", "userId", "recipient", "locale", "priority", "referenceType", "referenceId"])) {
        toast({ title: "Couldn't send", description: getErrorMessage(error), variant: "destructive" });
      }
    }
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send notification</DialogTitle>
          <DialogDescription>Dispatch an ad-hoc notification from an active template.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Channel" htmlFor="n-channel" required error={errors.channel?.message}>
              <Select id="n-channel" {...form.register("channel")}>
                {NOTIFICATION_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Template code" htmlFor="n-template" required error={errors.templateCode?.message}>
              <Input id="n-template" placeholder="ORDER_CONFIRMATION" {...form.register("templateCode")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="User ID" htmlFor="n-user" hint="UUID (or use recipient)" error={errors.userId?.message}>
              <Input id="n-user" className="font-tabular" {...form.register("userId")} />
            </Field>
            <Field label="Recipient" htmlFor="n-recipient" hint="email or phone" error={errors.recipient?.message}>
              <Input id="n-recipient" {...form.register("recipient")} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Locale" htmlFor="n-locale" error={errors.locale?.message}>
              <Input id="n-locale" placeholder="en" {...form.register("locale")} />
            </Field>
            <Field label="Priority" htmlFor="n-priority" hint="1–9" error={errors.priority?.message}>
              <Input id="n-priority" inputMode="numeric" placeholder="5" {...form.register("priority")} />
            </Field>
            <Field label="Ref type" htmlFor="n-reftype" error={errors.referenceType?.message}>
              <Input id="n-reftype" placeholder="ORDER" {...form.register("referenceType")} />
            </Field>
          </div>

          <Field label="Reference ID" htmlFor="n-refid" error={errors.referenceId?.message}>
            <Input id="n-refid" {...form.register("referenceId")} />
          </Field>

          <Field
            label="Variables (JSON)"
            htmlFor="n-vars"
            hint='e.g. {"orderId":"123","name":"Jane"}'
            error={errors.variablesJson?.message}
          >
            <Textarea id="n-vars" rows={3} className="font-mono text-xs" {...form.register("variablesJson")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={send.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={send.isPending}>
              {send.isPending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
