"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Label } from "@repo/ui/components/label";
import type { CategoryResponse, ProductResponse } from "@/core/api/types";
import { useCreateProduct, useUpdateProduct } from "@/features/admin/hooks";
import { productSchema, toProductRequest, type ProductFormValues } from "@/features/admin/schema";
import { ImageUpload } from "@/features/admin/image-upload";

const EMPTY: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  stock: "0",
  categoryId: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductResponse;
  categories: CategoryResponse[];
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSuccess,
  onError,
}: Props) {
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const isEdit = Boolean(product);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY,
  });

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
            categoryId: String(product.categoryId),
          }
        : EMPTY,
    );
  }, [open, product, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const body = toProductRequest(values);
    try {
      if (product) {
        await update.mutateAsync({ id: product.id, body });
        onSuccess(`"${body.name}" updated`);
      } else {
        await create.mutateAsync(body);
        onSuccess(`"${body.name}" created`);
      }
      onOpenChange(false);
    } catch {
      onError(`Couldn't save product — please try again.`);
    }
  });

  const pending = create.isPending || update.isPending;
  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the catalog entry." : "Add a product to the catalog."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input id="p-name" {...form.register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea id="p-desc" rows={3} {...form.register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-price">
                Price <span className="text-destructive">*</span>
              </Label>
              <Input id="p-price" inputMode="decimal" placeholder="19.99" {...form.register("price")} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-stock">
                Stock <span className="text-destructive">*</span>
              </Label>
              <Input id="p-stock" inputMode="numeric" {...form.register("stock")} />
              {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-cat">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select id="p-cat" {...form.register("categoryId")}>
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {errors.categoryId && (
              <p className="text-xs text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Image</Label>
            <Controller
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.imageUrl?.message}
                />
              )}
            />
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
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
