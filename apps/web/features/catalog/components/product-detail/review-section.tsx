"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Skeleton } from "@repo/ui/components/skeleton";
import { cn } from "@repo/ui/lib/utils";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/components/shared/toast";
import { getErrorMessage } from "@/components/shared/error-message";
import { useAuth } from "@/core/auth";
import { useCreateReview, useReviewList, useReviewSummary } from "../../services/useReviews";
import { reviewSchema, type ReviewFormValues } from "../../models/review-schema";

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={n <= Math.round(value) ? "fill-primary text-primary" : "text-muted-foreground"}
        />
      ))}
    </div>
  );
}

export function ReviewSection({ productId }: { productId: number }) {
  const { toast } = useToast();
  const { isAuthenticated, login } = useAuth();
  const summary = useReviewSummary(productId);
  const list = useReviewList({ productId, page: 0, size: 5 });
  const createReview = useCreateReview();
  const [formOpen, setFormOpen] = useState(false);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, title: "", comment: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createReview.mutateAsync({
        productId,
        rating: values.rating,
        title: values.title || undefined,
        comment: values.comment || undefined,
      });
      toast({ title: "Review submitted", variant: "success" });
      form.reset({ rating: 5, title: "", comment: "" });
      setFormOpen(false);
    } catch (error) {
      toast({ title: "Couldn't submit review", description: getErrorMessage(error), variant: "destructive" });
    }
  });

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-foreground">Reviews</h2>
        {isAuthenticated ? (
          <Button variant="outline" size="sm" onClick={() => setFormOpen((v) => !v)}>
            {formOpen ? "Cancel" : "Write a review"}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => login()}>
            Sign in to review
          </Button>
        )}
      </div>

      {summary.isLoading ? (
        <Skeleton className="h-6 w-40" />
      ) : summary.data && summary.data.totalReviews > 0 ? (
        <div className="flex items-center gap-2">
          <Stars value={summary.data.averageRating} />
          <span className="font-tabular text-sm font-medium text-foreground">
            {summary.data.averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">
            ({summary.data.totalReviews} review{summary.data.totalReviews === 1 ? "" : "s"})
          </span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>
      )}

      {formOpen ? (
        <form onSubmit={onSubmit} className={cn("flex flex-col gap-4 rounded-lg border border-border p-4")}>
          <Field label="Rating" htmlFor="rating" required error={form.formState.errors.rating?.message}>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  onClick={() => form.setValue("rating", n, { shouldValidate: true })}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      "size-6",
                      n <= form.watch("rating") ? "fill-primary text-primary" : "text-muted-foreground",
                    )}
                  />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Title" htmlFor="review-title" error={form.formState.errors.title?.message}>
            <Input id="review-title" {...form.register("title")} />
          </Field>
          <Field label="Comment" htmlFor="review-comment" error={form.formState.errors.comment?.message}>
            <Textarea id="review-comment" rows={3} {...form.register("comment")} />
          </Field>
          <Button type="submit" disabled={createReview.isPending} className="w-fit">
            {createReview.isPending ? "Submitting…" : "Submit review"}
          </Button>
        </form>
      ) : null}

      {list.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : null}

      {!list.isLoading && (list.data?.content.length ?? 0) === 0 ? null : (
        <ul className="flex flex-col divide-y divide-border">
          {list.data?.content.map((review) => (
            <li key={review.id} className="flex flex-col gap-1 py-4">
              <div className="flex items-center gap-2">
                <Stars value={review.rating} size={14} />
                {review.title ? <span className="text-sm font-medium text-foreground">{review.title}</span> : null}
              </div>
              {review.comment ? <p className="text-sm text-muted-foreground">{review.comment}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
