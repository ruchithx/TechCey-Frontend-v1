import { z } from "zod";
import type { CategoryRequest, ProductRequest } from "@/core/api/types";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  price: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price, e.g. 19.99"),
  imageUrl: z.string().trim().url("Enter a valid URL").or(z.literal("")),
  stock: z.string().trim().regex(/^\d+$/, "Whole numbers only"),
  categoryId: z.string().min(1, "Select a category"),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export function toProductRequest(v: ProductFormValues): ProductRequest {
  return {
    name: v.name.trim(),
    description: v.description?.trim() || null,
    price: v.price.trim(),
    imageUrl: v.imageUrl.trim() || null,
    stock: Number(v.stock),
    categoryId: Number(v.categoryId),
  };
}

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export function toCategoryRequest(v: CategoryFormValues): CategoryRequest {
  return {
    name: v.name.trim(),
    description: v.description?.trim() || null,
  };
}
