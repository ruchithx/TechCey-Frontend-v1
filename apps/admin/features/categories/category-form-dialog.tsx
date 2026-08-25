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
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/components/shared/toast";
import { applyFieldErrors } from "@/components/shared/apply-field-errors";
import { getErrorMessage } from "@/components/shared/error-message";
import type { CategoryResponse } from "@/core/api/types";
import { useCreateCategory, useUpdateCategory } from "@/features/categories/hooks";
import {
  categorySchema,
  toCategoryRequest,
  type CategoryFormValues,
} from "@/features/categories/schema";

const FIELDS = ["name", "description"] as const;

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryResponse;
}) {
  const { toast } = useToast();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const isEdit = Boolean(category);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ name: category?.name ?? "", description: category?.description ?? "" });
  }, [open, category, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const body = toCategoryRequest(values);
    try {
      if (category) {
        await update.mutateAsync({ id: category.id, body });
        toast({ title: "Category updated", description: body.name, variant: "success" });
      } else {
        await create.mutateAsync(body);
        toast({ title: "Category created", description: body.name, variant: "success" });
      }
      onOpenChange(false);
    } catch (error) {
      if (!applyFieldErrors(error, form.setError, FIELDS)) {
        toast({ title: "Couldn't save category", description: getErrorMessage(error), variant: "destructive" });
      }
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
            {isEdit ? "Rename or re-describe this category." : "Group products under a new category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Name" htmlFor="cat-name" required error={errors.name?.message}>
            <Input id="cat-name" {...form.register("name")} />
          </Field>
          <Field label="Description" htmlFor="cat-desc" error={errors.description?.message}>
            <Textarea id="cat-desc" rows={3} {...form.register("description")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
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
