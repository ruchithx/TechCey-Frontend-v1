import { z } from "zod";

/** Mirrors review-service's CreateReviewRequest validation (rating 1-5, title <=150, comment <=4000). */
export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Pick a star rating").max(5),
  title: z.string().max(150, "Keep the title under 150 characters").optional(),
  comment: z.string().max(4000, "Keep the comment under 4000 characters").optional(),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
