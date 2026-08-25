import { request } from "@/core/api/http";
import { ENDPOINTS } from "@/core/api/endpoints";

/**
 * review-service has no dedicated admin endpoints — an ADMIN simply has the
 * elevated privilege to delete ANY user's review (ADMIN_API.md §8). The service
 * decides this from the gateway-injected X-User-Roles; no special payload.
 */
export function deleteReview(id: string): Promise<void> {
  return request<void>(ENDPOINTS.reviews.remove(id), { method: "DELETE" });
}
