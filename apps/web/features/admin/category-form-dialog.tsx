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
import { Label } from "@repo/ui/components/label";
import type { CategoryResponse } from "@/core/api/types";
import { useCreateCategory, useUpdateCategory } from "@/features/admin/hooks";
import {
  categorySchema,
  toCategoryRequest,
  type CategoryFormValues,
} from "@/features/admin/schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryResponse;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
  onError,
}: Props) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const isEdit = Boolean(category);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: category?.name ?? "",
      description: category?.description ?? "",
    });
  }, [open, category, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const body = toCategoryRequest(values);
    try {
      if (category) {
        await update.mutateAsync({ id: category.id, body });
        onSuccess(`"${body.name}" updated`);
      } else {
        await create.mutateAsync(body);
        onSuccess(`"${body.name}" created`);
      }
      onOpenChange(false);
    } catch {
      onError(`Couldn't save category — please try again.`);
    }
  });

  const pending = create.isPending || update.isPending;
  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Rename or re-describe this category."
              : "Group products under a new category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input id="c-name" {...form.register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea id="c-desc" rows={3} {...form.register("description")} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
