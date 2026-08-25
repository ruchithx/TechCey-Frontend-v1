import { request } from "@/core/api/http";
import { ENDPOINTS } from "@/core/api/endpoints";
import type { CategoryRequest, CategoryResponse } from "@/core/api/types";

/** product-service returns RAW DTOs (no envelope) for categories. */
export function listCategories(signal?: AbortSignal): Promise<CategoryResponse[]> {
  return request<CategoryResponse[]>(ENDPOINTS.categories.list(), { signal });
}

export function createCategory(body: CategoryRequest): Promise<CategoryResponse> {
  return request<CategoryResponse>(ENDPOINTS.categories.create(), { method: "POST", body });
}

export function updateCategory(id: number, body: CategoryRequest): Promise<CategoryResponse> {
  return request<CategoryResponse>(ENDPOINTS.categories.update(id), { method: "PUT", body });
}

export function deleteCategory(id: number): Promise<void> {
  return request<void>(ENDPOINTS.categories.remove(id), { method: "DELETE" });
}
