import { z } from "zod";
import type { CategoryRequest } from "@/core/api/types";

/** Mirrors CreateCategoryRequest/UpdateCategoryRequest (ADMIN_API.md §3). */
export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export function toCategoryRequest(values: CategoryFormValues): CategoryRequest {
  return {
    name: values.name.trim(),
    description: values.description?.trim() ? values.description.trim() : null,
  };
}
