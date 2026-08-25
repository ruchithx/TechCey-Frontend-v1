"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import type { CategoryRequest } from "@/core/api/types";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/features/categories/api";

export function useCategoryList() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: ({ signal }) => listCategories(signal),
    staleTime: 60_000, // catalog taxonomy changes rarely
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CategoryRequest) => createCategory(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: CategoryRequest }) => updateCategory(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      // Products embed their category, so refresh them too.
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
