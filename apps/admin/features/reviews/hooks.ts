"use client";

import { useMutation } from "@tanstack/react-query";
import { deleteReview } from "@/features/reviews/api";

export function useDeleteReview() {
  return useMutation({
    mutationFn: (id: string) => deleteReview(id),
  });
}
