"use client";

import { useState } from "react";
import { Info, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { PageHeader } from "@/components/shared/page-header";
import { Field } from "@/components/shared/form-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/shared/toast";
import { getErrorMessage } from "@/components/shared/error-message";
import { useDeleteReview } from "@/features/reviews/hooks";

export function ReviewsPage() {
  const { toast } = useToast();
  const del = useDeleteReview();
  const [reviewId, setReviewId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function confirmDelete() {
    try {
      await del.mutateAsync(reviewId.trim());
      toast({ title: "Review deleted", description: reviewId.trim(), variant: "success" });
      setReviewId("");
      setConfirmOpen(false);
    } catch (error) {
      toast({ title: "Couldn't delete review", description: getErrorMessage(error), variant: "destructive" });
      setConfirmOpen(false);
    }
  }

  return (
    <div>
      <PageHeader title="Reviews" description="Moderate product reviews." />

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          As an admin you can delete any user&apos;s review by its ID. The review service authorises
          this from your role — no list endpoint is exposed for moderation.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="size-4 text-destructive" /> Delete a review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (reviewId.trim()) setConfirmOpen(true);
            }}
            className="space-y-4"
          >
            <Field label="Review ID" htmlFor="review-id" required>
              <Input
                id="review-id"
                placeholder="Review ID"
                value={reviewId}
                onChange={(e) => setReviewId(e.target.value)}
                className="font-tabular"
              />
            </Field>
            <Button type="submit" variant="destructive" disabled={!reviewId.trim()}>
              <Trash2 className="size-4" /> Delete review
            </Button>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this review?"
        description={
          <>
            This permanently removes review{" "}
            <span className="font-tabular font-medium">{reviewId.trim()}</span>.
          </>
        }
        confirmLabel="Delete review"
        pending={del.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
