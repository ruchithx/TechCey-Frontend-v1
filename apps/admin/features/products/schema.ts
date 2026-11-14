import { z } from "zod";
import type { ProductRequest } from "@/core/api/types";

/**
 * Mirrors the backend CreateProductRequest/UpdateProductRequest validation
 * (ADMIN_API.md §2). All fields are kept as strings in the form (native input
 * values) and converted to the typed request on submit — Money stays a string
 * throughout, never a float.
 */
export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  price: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price (e.g. 19.99)"),
  imageUrl: z.string().trim().url("Enter a valid URL").or(z.literal("")),
  stock: z.string().trim().regex(/^\d+$/, "Whole numbers only"),
  categoryId: z.string().min(1, "Select a category"),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export function toProductRequest(values: ProductFormValues): ProductRequest {
  return {
    name: values.name.trim(),
    description: values.description?.trim() ? values.description.trim() : null,
    price: values.price.trim(),
    imageUrl: values.imageUrl.trim() ? values.imageUrl.trim() : null,
    stock: Number(values.stock),
    categoryId: Number(values.categoryId),
  };
}
