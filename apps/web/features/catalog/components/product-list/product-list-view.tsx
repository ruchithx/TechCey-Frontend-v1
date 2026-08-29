"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { DEFAULT_PAGE_SIZE } from "@/core/config/constants";
import { QueryState } from "@/components/shared/data-state";
import { Pagination } from "@/components/shared/pagination";
import { useProductList } from "../../services/useProductList";
import { useCategories } from "../../services/useCategories";
import { ProductCard, ProductCardSkeleton } from "../product-card";
import { ProductFilters, type ProductFiltersValue } from "./product-filters";

/** Shared by ProductListPage (all products) and CategoryPage (locked to one category). */
export function ProductListView({ lockedCategoryId }: { lockedCategoryId?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const keyword = searchParams.get("keyword") ?? "";
  const categoryId = lockedCategoryId ? String(lockedCategoryId) : (searchParams.get("categoryId") ?? "");
  const sort = searchParams.get("sort") ?? "createdAt,desc";
  const page = Number(searchParams.get("page") ?? 0);

  const filtersValue: ProductFiltersValue = { keyword, categoryId, sort };

  const setParams = useCallback(
    (next: Partial<ProductFiltersValue> & { page?: number }) => {
      const params = new URLSearchParams(searchParams.toString());
      const merged = { ...filtersValue, page, ...next };

      if (merged.keyword) params.set("keyword", merged.keyword);
      else params.delete("keyword");

      if (!lockedCategoryId) {
        if (merged.categoryId) params.set("categoryId", merged.categoryId);
        else params.delete("categoryId");
      }

      if (merged.sort) params.set("sort", merged.sort);

      // Any filter change resets pagination unless the caller only changed the page.
      const nextPage = next.page !== undefined ? next.page : 0;
      if (nextPage > 0) params.set("page", String(nextPage));
      else params.delete("page");

      router.push(`${pathname}?${params.toString()}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname, router, searchParams, lockedCategoryId, keyword, categoryId, sort, page],
  );

  const categoriesQuery = useCategories();
  const query = useProductList(
    useMemo(
      () => ({
        keyword: keyword || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        sort,
        page,
        size: DEFAULT_PAGE_SIZE,
      }),
      [keyword, categoryId, sort, page],
    ),
  );

  const products = query.data?.content ?? [];

  return (
    <div className="flex flex-col gap-6">
      {!lockedCategoryId ? (
        <ProductFilters
          value={filtersValue}
          categories={categoriesQuery.data ?? []}
          onChange={(next) => setParams(next)}
        />
      ) : null}

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
        isEmpty={products.length === 0}
        skeleton={
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: DEFAULT_PAGE_SIZE }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        }
        empty={
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card/50 py-16 text-center">
            <PackageSearch className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No products found</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try a different search term, category, or clear your filters.
            </p>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-2">
          <Pagination
            page={query.data?.page ?? 0}
            totalPages={query.data?.totalPages ?? 1}
            totalElements={query.data?.totalElements ?? products.length}
            onChange={(nextPage) => setParams({ page: nextPage })}
          />
        </div>
      </QueryState>
    </div>
  );
}
