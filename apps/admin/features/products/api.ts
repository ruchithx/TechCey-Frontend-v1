import { request } from "@/core/api/http";
import { ENDPOINTS } from "@/core/api/endpoints";
import { normalisePage, type Page } from "@/core/api/page";
import type { ProductListParams, ProductRequest, ProductResponse } from "@/core/api/types";

/** product-service returns a RAW PageResponse (no envelope); normalise it. */
export async function listProducts(
  params: ProductListParams,
  signal?: AbortSignal,
): Promise<Page<ProductResponse>> {
  const raw = await request<unknown>(ENDPOINTS.products.list(), { params, signal });
  return normalisePage<ProductResponse>(raw);
}

export function getProduct(id: number, signal?: AbortSignal): Promise<ProductResponse> {
  return request<ProductResponse>(ENDPOINTS.products.byId(id), { signal });
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
