import { useQuery } from "@tanstack/react-query";
import { request } from "@/core/api";

export interface ReviewItem {
  id: number;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewSummary {
  productId: number;
  average: number;
  count: number;
  items: ReviewItem[];
}

/** Fetches reviews from the stub review-service endpoint (MSW-intercepted in dev). */
export function useProductReviews(productId: number) {
  return useQuery({
    queryKey: ["reviews", "product", productId],
    queryFn: () =>
      request<ReviewSummary>("/api/reviews", { params: { productId } }),
    staleTime: 120_000,
    enabled: productId > 0,
  });
}
