import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ENDPOINTS,
  queryKeys,
  request,
  type CustomerAccountResponse,
  type UpdateCustomerAccountRequest,
} from "@/core/api";

/**
 * The signed-in customer's account (`GET /api/v1/customers/me`). Identity comes
 * from the gateway-verified token — there is no id parameter and no way to load
 * anyone else. Returns the Keycloak identity block merged with the backend-owned
 * `phoneNumber` / `preferredLocale` / `defaultAddressId`.
 *
 * Kept fresh-ish: Keycloak is the source of truth for identity and the customer
 * can edit their own details here, so a short staleTime is enough.
 */
export function useAccount() {
  return useQuery({
    queryKey: queryKeys.customers.me(),
    queryFn: () => request<CustomerAccountResponse>(ENDPOINTS.customers.me()),
    staleTime: 60_000,
  });
}

/**
 * Update the caller's own account (`PUT /api/v1/customers/me`). The backend does
 * a partial update — only the fields we send change. `firstName` / `lastName`
 * are proxied to Keycloak; `phoneNumber` / `preferredLocale` / `defaultAddressId`
 * are stored by user-service. `username` / `email` are Keycloak-managed and are
 * not part of the request type.
 *
 * On success the fresh account is written straight into the cache so the page
 * reflects the change immediately, then the customer domain is invalidated so
 * anything derived (e.g. the address list's default flag) stays authoritative.
 *
 * Note: `useAuth().currentUser` is derived from the JWT, so the header greeting
 * only picks up a new name after the next token refresh — expected.
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateCustomerAccountRequest) =>
      request<CustomerAccountResponse>(ENDPOINTS.customers.me(), { method: "PUT", body }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.customers.me(), updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}
