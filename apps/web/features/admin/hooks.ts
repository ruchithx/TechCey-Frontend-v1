"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import type { CategoryRequest, ProductListParams, ProductRequest } from "@/core/api/types";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  listCategories,
  listProducts,
  updateCategory,
  updateProduct,
} from "@/features/admin/api";

const DEFAULT_SIZE = 20;

export function useAdminProductList(params: ProductListParams = {}) {
  return useQuery({
    queryKey: queryKeys.products.list({ ...params, size: params.size ?? DEFAULT_SIZE }),
    queryFn: ({ signal }) =>
      listProducts({ ...params, size: params.size ?? DEFAULT_SIZE }, signal),
    placeholderData: keepPreviousData,
  });
}

export function useAdminCategoryList() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: ({ signal }) => listCategories(signal),
    staleTime: 60_000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductRequest) => createProduct(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ProductRequest }) => updateProduct(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CategoryRequest) => createCategory(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: CategoryRequest }) => updateCategory(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
