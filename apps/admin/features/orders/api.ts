import { request } from "@/core/api/http";
import { ENDPOINTS } from "@/core/api/endpoints";

/**
 * The only admin-specific order endpoint (ADMIN_API.md §5). Order READS are
 * scoped to the caller's own X-User-Id, so there is intentionally no admin
 * "get any order" call here — only the privileged delete.
 */
export function deleteOrder(id: string): Promise<void> {
  return request<void>(ENDPOINTS.orders.remove(id), { method: "DELETE" });
}
