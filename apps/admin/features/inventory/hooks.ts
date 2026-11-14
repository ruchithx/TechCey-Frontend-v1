"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import type {
  AdjustStockRequest,
  CreateInventoryRequest,
  MovementListParams,
  SetStockRequest,
  UpdateReorderLevelRequest,
} from "@/core/api/types";
import {
  adjustStock,
  createInventory,
  getInventory,
  getLowStock,
  getMovements,
  setStock,
  updateReorderLevel,
} from "@/features/inventory/api";

export function useLowStock() {
  return useQuery({
    queryKey: queryKeys.inventory.lowStock(),
    queryFn: ({ signal }) => getLowStock(signal),
  });
}

export function useInventory(productId: number | null) {
  return useQuery({
    queryKey: productId ? queryKeys.inventory.detail(productId) : ["inventory", "detail", "none"],
    queryFn: ({ signal }) => getInventory(productId as number, signal),
    enabled: productId != null && Number.isFinite(productId),
  });
}

export function useMovements(productId: number, params: MovementListParams) {
  return useQuery({
    queryKey: queryKeys.inventory.movements(productId, params),
    queryFn: ({ signal }) => getMovements(productId, params, signal),
    placeholderData: keepPreviousData,
  });
}

function useInventoryInvalidator() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: queryKeys.inventory.all });
}

export function useCreateInventory() {
  const invalidate = useInventoryInvalidator();
  return useMutation({
    mutationFn: (body: CreateInventoryRequest) => createInventory(body),
    onSuccess: invalidate,
  });
}

export function useSetStock() {
  const invalidate = useInventoryInvalidator();
  return useMutation({
    mutationFn: ({ productId, body }: { productId: number; body: SetStockRequest }) =>
      setStock(productId, body),
    onSuccess: invalidate,
  });
}

export function useAdjustStock() {
  const invalidate = useInventoryInvalidator();
  return useMutation({
    mutationFn: ({ productId, body }: { productId: number; body: AdjustStockRequest }) =>
      adjustStock(productId, body),
    onSuccess: invalidate,
  });
}

export function useUpdateReorderLevel() {
  const invalidate = useInventoryInvalidator();
  return useMutation({
    mutationFn: ({ productId, body }: { productId: number; body: UpdateReorderLevelRequest }) =>
      updateReorderLevel(productId, body),
    onSuccess: invalidate,
  });
}
