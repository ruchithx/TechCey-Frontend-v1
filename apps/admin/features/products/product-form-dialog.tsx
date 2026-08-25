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
import type { CategoryResponse, ProductResponse } from "@/core/api/types";
import { useCreateProduct, useUpdateProduct } from "@/features/products/hooks";
import { productSchema, toProductRequest, type ProductFormValues } from "@/features/products/schema";

const EMPTY: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  stock: "0",
  categoryId: "",
};

const FIELDS = ["name", "description", "price", "imageUrl", "stock", "categoryId"] as const;

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductResponse;
  categories: CategoryResponse[];
}) {
  const { toast } = useToast();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const isEdit = Boolean(product);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY,
  });

  // Reset the form whenever the target product (or open state) changes.
  useEffect(() => {
    if (!open) return;
    form.reset(
      product
        ? {
            name: product.name,
            description: product.description ?? "",
            price: String(product.price),
            imageUrl: product.imageUrl ?? "",
            stock: String(product.stock),
            categoryId: product.category ? String(product.category.id) : "",
          }
        : EMPTY,
    );
  }, [open, product, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const body = toProductRequest(values);
    try {
      if (product) {
        await update.mutateAsync({ id: product.id, body });
        toast({ title: "Product updated", description: body.name, variant: "success" });
      } else {
        await create.mutateAsync(body);
        toast({ title: "Product created", description: body.name, variant: "success" });
      }
      onOpenChange(false);
    } catch (error) {
      if (!applyFieldErrors(error, form.setError, FIELDS)) {
        toast({ title: "Couldn't save product", description: getErrorMessage(error), variant: "destructive" });
      }
    }
  });

  const pending = create.isPending || update.isPending;
  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the catalog entry." : "Add a product to the catalog."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" {...form.register("name")} />
          </Field>

          <Field label="Description" htmlFor="description" error={errors.description?.message}>
            <Textarea id="description" rows={3} {...form.register("description")} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Price" htmlFor="price" required error={errors.price?.message} hint="Decimal, e.g. 19.99">
              <Input id="price" inputMode="decimal" {...form.register("price")} />
            </Field>
            <Field label="Stock" htmlFor="stock" required error={errors.stock?.message}>
              <Input id="stock" inputMode="numeric" {...form.register("stock")} />
            </Field>
          </div>

          <Field label="Category" htmlFor="categoryId" required error={errors.categoryId?.message}>
            <Select id="categoryId" {...form.register("categoryId")}>
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Image URL" htmlFor="imageUrl" error={errors.imageUrl?.message}>
            <Input id="imageUrl" placeholder="https://…" {...form.register("imageUrl")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
