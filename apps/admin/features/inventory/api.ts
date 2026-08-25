import { request } from "@/core/api/http";
import { ENDPOINTS } from "@/core/api/endpoints";
import { normalisePage, type Page } from "@/core/api/page";
import type {
  AdjustStockRequest,
  CreateInventoryRequest,
  InventoryResponse,
  MovementListParams,
  SetStockRequest,
  StockMovementResponse,
  UpdateReorderLevelRequest,
} from "@/core/api/types";

/** inventory-service uses the COMMON envelope; the HTTP layer unwraps `.data`. */

export function getLowStock(signal?: AbortSignal): Promise<InventoryResponse[]> {
  return request<InventoryResponse[]>(ENDPOINTS.inventory.lowStock(), { signal });
}

export function getInventory(productId: number, signal?: AbortSignal): Promise<InventoryResponse> {
  return request<InventoryResponse>(ENDPOINTS.inventory.byProduct(productId), { signal });
}

export function createInventory(body: CreateInventoryRequest): Promise<InventoryResponse> {
  return request<InventoryResponse>(ENDPOINTS.inventory.create(), { method: "POST", body });
}

export function setStock(productId: number, body: SetStockRequest): Promise<InventoryResponse> {
  return request<InventoryResponse>(ENDPOINTS.inventory.setStock(productId), { method: "PUT", body });
}

export function adjustStock(productId: number, body: AdjustStockRequest): Promise<InventoryResponse> {
  return request<InventoryResponse>(ENDPOINTS.inventory.adjust(productId), { method: "PATCH", body });
}

export function updateReorderLevel(
  productId: number,
  body: UpdateReorderLevelRequest,
): Promise<InventoryResponse> {
  return request<InventoryResponse>(ENDPOINTS.inventory.reorderLevel(productId), {
    method: "PATCH",
    body,
  });
}

export async function getMovements(
  productId: number,
  params: MovementListParams,
  signal?: AbortSignal,
): Promise<Page<StockMovementResponse>> {
  const raw = await request<unknown>(ENDPOINTS.inventory.movements(productId), { params, signal });
  return normalisePage<StockMovementResponse>(raw);
}
