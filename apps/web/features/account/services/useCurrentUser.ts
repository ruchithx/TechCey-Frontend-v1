import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ENDPOINTS,
  queryKeys,
  request,
  type CurrentUserResponse,
  type UpdateProfileRequest,
} from "@/core/api";

/**
 * The signed-in customer's own profile (`GET /api/v1/users/me`). Identity comes
 * from the gateway-verified token — there is no id parameter and no way to load
 * anyone else. Kept fresh-ish: Keycloak is the source of truth and a name can be
 * changed from the account page, so a short staleTime is enough.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => request<CurrentUserResponse>(ENDPOINTS.users.me()),
    staleTime: 60_000,
  });
}

/**
 * Update the caller's `firstName` / `lastName` (`PATCH /api/v1/users/me`).
 * On success the fresh profile is written straight into the cache so the account
 * page reflects the change immediately, then invalidated to stay authoritative.
 *
 * Note: `useAuth().currentUser` is derived from the JWT, so the header greeting
 * only picks up a new name after the next token refresh — expected, and the
 * account page reads from this query, not the token.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) =>
      request<CurrentUserResponse>(ENDPOINTS.users.me(), { method: "PATCH", body }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.users.me(), updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
