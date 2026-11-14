import { request } from "@/core/api/http";
import { ENDPOINTS } from "@/core/api/endpoints";
import { normalisePage, type Page } from "@/core/api/page";
import type {
  CategoryRequest,
  CategoryResponse,
  ProductListParams,
  ProductRequest,
  ProductResponse,
} from "@/core/api/types";

/* -------------------------------- products -------------------------------- */

export async function listProducts(
  params: ProductListParams,
  signal?: AbortSignal,
): Promise<Page<ProductResponse>> {
  const raw = await request<unknown>(ENDPOINTS.products.list(), { params: { ...params }, signal });
  return normalisePage<ProductResponse>(raw);
}

export function createProduct(body: ProductRequest): Promise<ProductResponse> {
  return request<ProductResponse>(ENDPOINTS.products.create(), { method: "POST", body });
}

export function updateProduct(id: number, body: ProductRequest): Promise<ProductResponse> {
  return request<ProductResponse>(ENDPOINTS.products.update(id), { method: "PUT", body });
}

export function deleteProduct(id: number): Promise<void> {
  return request<void>(ENDPOINTS.products.remove(id), { method: "DELETE" });
}

/* ------------------------------- categories ------------------------------- */

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
