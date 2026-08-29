import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS, queryKeys, request, type CartResponse } from "@/core/api";
import { useAuth } from "@/core/auth";

/**
 * The current user's cart. cart-service has no anonymous-cart endpoint — every
 * route requires a bearer token — so this is disabled entirely for signed-out
 * visitors rather than faking a guest cart the backend can't support.
 */
export function useCart() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: () => request<CartResponse>(ENDPOINTS.cart.get()),
    enabled: isAuthenticated,
    staleTime: 10_000,
  });
}
