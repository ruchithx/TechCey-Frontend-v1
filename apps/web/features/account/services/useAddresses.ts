import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ENDPOINTS,
  queryKeys,
  request,
  type AddressRequest,
  type AddressResponse,
} from "@/core/api";

/**
 * The signed-in customer's saved-address book (`GET /api/v1/customers/me/addresses`,
 * envelope-wrapped, oldest first). Every entry is owned by the caller — the
 * backend scopes the query by the gateway-verified id, so another customer's row
 * is indistinguishable from a missing one.
 */
export function useAddresses() {
  return useQuery({
    queryKey: queryKeys.customers.addresses(),
    queryFn: () => request<AddressResponse[]>(ENDPOINTS.customers.addresses()),
    staleTime: 60_000,
  });
}

/** Invalidate everything customer-scoped — the address list and `defaultAddressId`. */
function useInvalidateCustomer() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
}

/** Add an address (`POST /api/v1/customers/me/addresses`). The first one saved becomes the default. */
export function useAddAddress() {
  const invalidate = useInvalidateCustomer();
  return useMutation({
    mutationFn: (body: AddressRequest) =>
      request<AddressResponse>(ENDPOINTS.customers.addresses(), { method: "POST", body }),
    onSuccess: () => invalidate(),
  });
}

/** Edit an address (`PUT /api/v1/customers/me/addresses/{id}`). 404 if it isn't the caller's. */
export function useUpdateAddress() {
  const invalidate = useInvalidateCustomer();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: AddressRequest }) =>
      request<AddressResponse>(ENDPOINTS.customers.address(id), { method: "PUT", body }),
    onSuccess: () => invalidate(),
  });
}

/** Delete an address (`DELETE /api/v1/customers/me/addresses/{id}`). Clears the default if it was one. */
export function useDeleteAddress() {
  const invalidate = useInvalidateCustomer();
  return useMutation({
    mutationFn: (id: string) =>
      request<void>(ENDPOINTS.customers.address(id), { method: "DELETE" }),
    onSuccess: () => invalidate(),
  });
}

/**
 * Promote an existing address to the customer's default. Rather than re-sending
 * the whole address with `makeDefault`, this goes through `PUT /customers/me`
 * with just `defaultAddressId` — the backend validates it belongs to the caller.
 */
export function useSetDefaultAddress() {
  const invalidate = useInvalidateCustomer();
  return useMutation({
    mutationFn: (id: string) =>
      request<unknown>(ENDPOINTS.customers.me(), {
        method: "PUT",
        body: { defaultAddressId: id },
      }),
    onSuccess: () => invalidate(),
  });
}
