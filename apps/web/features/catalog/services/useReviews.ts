import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ENDPOINTS,
  normalisePage,
  queryKeys,
  request,
  type CreateReviewRequest,
  type Page,
  type ReviewListParams,
  type ReviewResponse,
  type ReviewSummaryResponse,
} from "@/core/api";

/** Aggregate rating for a product's star widget. Public — no auth required. */
export function useReviewSummary(productId: number) {
  return useQuery({
    queryKey: queryKeys.reviews.summary(productId),
    queryFn: () =>
      request<ReviewSummaryResponse>(ENDPOINTS.reviews.summary(), { params: { productId } }),
    enabled: Number.isFinite(productId),
    staleTime: 60_000,
  });
}

/** Paged review list for one product, newest first by default. Public. */
export function useReviewList(params: ReviewListParams) {
  return useQuery({
    queryKey: queryKeys.reviews.list(params),
    queryFn: () =>
      request<Page<ReviewResponse>>(ENDPOINTS.reviews.list(), { params: { ...params } }).then((raw) =>
        normalisePage<ReviewResponse>(raw),
      ),
    enabled: Boolean(params.productId),
    staleTime: 30_000,
  });
}

/** Write a review. Requires auth — the gateway injects X-User-Id from the token. */
export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReviewRequest) =>
      request<ReviewResponse>(ENDPOINTS.reviews.list(), { method: "POST", body }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.summary(variables.productId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
  });
}
