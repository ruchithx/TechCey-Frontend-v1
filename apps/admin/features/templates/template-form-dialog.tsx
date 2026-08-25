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
import {
  NOTIFICATION_CHANNELS,
  TEMPLATE_CONTENT_TYPES,
  type TemplateResponse,
} from "@/core/api/types";
import { useCreateTemplate, useUpdateTemplate } from "@/features/templates/hooks";
import {
  templateSchema,
  toTemplateRequest,
  type TemplateFormValues,
} from "@/features/templates/schema";

const EMPTY: TemplateFormValues = {
  code: "",
  channel: "EMAIL",
  locale: "en",
  subjectTemplate: "",
  bodyTemplate: "",
  contentType: "HTML",
  requiredVars: "",
  description: "",
};

const FIELDS = [
  "code",
  "channel",
  "locale",
  "subjectTemplate",
  "bodyTemplate",
  "contentType",
  "requiredVars",
  "description",
] as const;

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: TemplateResponse;
}) {
  const { toast } = useToast();
  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  const isEdit = Boolean(template);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      template
        ? {
            code: template.code,
            channel: template.channel,
            locale: template.locale ?? "en",
            subjectTemplate: template.subjectTemplate ?? "",
            bodyTemplate: template.bodyTemplate,
            contentType: template.contentType,
            requiredVars: template.requiredVars.join(", "),
            description: template.description ?? "",
          }
        : EMPTY,
    );
  }, [open, template, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const body = toTemplateRequest(values);
    try {
      if (template) {
        await update.mutateAsync({ id: template.id, body });
        toast({ title: "Template updated", description: body.code, variant: "success" });
      } else {
        await create.mutateAsync(body);
        toast({ title: "Template created", description: body.code, variant: "success" });
      }
      onOpenChange(false);
    } catch (error) {
      if (isAppError(error) && error.status === 409) {
        form.setError("code", { type: "server", message: "A template with this code already exists" });
        return;
      }
      if (!applyFieldErrors(error, form.setError, FIELDS)) {
        toast({ title: "Couldn't save template", description: getErrorMessage(error), variant: "destructive" });
      }
    }
  });

  const pending = create.isPending || update.isPending;
  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit template" : "New template"}</DialogTitle>
          <DialogDescription>
            Handlebars-style placeholders like <code>{"{{orderId}}"}</code> are rendered at send time.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code" htmlFor="t-code" required error={errors.code?.message}>
              <Input id="t-code" placeholder="ORDER_CONFIRMATION" disabled={isEdit} {...form.register("code")} />
            </Field>
            <Field label="Channel" htmlFor="t-channel" required error={errors.channel?.message}>
              <Select id="t-channel" {...form.register("channel")}>
                {NOTIFICATION_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Locale" htmlFor="t-locale" hint="Default en" error={errors.locale?.message}>
              <Input id="t-locale" placeholder="en" {...form.register("locale")} />
            </Field>
            <Field label="Content type" htmlFor="t-content" required error={errors.contentType?.message}>
              <Select id="t-content" {...form.register("contentType")}>
                {TEMPLATE_CONTENT_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Subject template" htmlFor="t-subject" error={errors.subjectTemplate?.message}>
            <Input id="t-subject" placeholder="Your order {{orderId}} is confirmed" {...form.register("subjectTemplate")} />
          </Field>

          <Field label="Body template" htmlFor="t-body" required error={errors.bodyTemplate?.message}>
            <Textarea id="t-body" rows={5} className="font-mono text-xs" {...form.register("bodyTemplate")} />
          </Field>

          <Field
            label="Required variables"
            htmlFor="t-vars"
            hint="Comma-separated, e.g. orderId, name"
            error={errors.requiredVars?.message}
          >
            <Input id="t-vars" placeholder="orderId, name" {...form.register("requiredVars")} />
          </Field>

          <Field label="Description" htmlFor="t-desc" error={errors.description?.message}>
            <Input id="t-desc" {...form.register("description")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
