"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@repo/ui/components/skeleton";
import { ErrorState, EmptyState } from "@/components/shared/data-state";
import { useCategory } from "../../services/useCategory";
import { ProductListView } from "../product-list/product-list-view";

/**
 * Route is `/categories/:slug`, but CategoryResponse has no slug field yet
 * (see catalog README) — the segment is the category's numeric id.
 */
export function CategoryDetailView() {
  const params = useParams<{ slug: string }>();
  const categoryId = Number(params.slug);

  const categoryQuery = useCategory(categoryId);

  if (!Number.isFinite(categoryId)) {
    return <EmptyState title="Category not found" description="That category link looks invalid." />;
  }
  if (categoryQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  if (categoryQuery.isError) {
    return <ErrorState error={categoryQuery.error} onRetry={categoryQuery.refetch} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{categoryQuery.data?.name}</h1>
        {categoryQuery.data?.description ? (
          <p className="text-sm text-muted-foreground">{categoryQuery.data.description}</p>
        ) : null}
      </div>
      <ProductListView lockedCategoryId={categoryId} />
    </div>
  );
}
