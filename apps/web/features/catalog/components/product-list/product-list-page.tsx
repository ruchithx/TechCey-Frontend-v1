"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Select } from "@repo/ui/components/select";
import { isAppError } from "@/core/errors/app-error";
import { useAuth } from "@/core/auth";
import { useProductList } from "../../services/useProductList";
import { useCategories } from "../../services/useCategories";
import { ProductCard, ProductCardSkeleton } from "../product-card";

const PAGE_SIZE = 12;

/* ------------------------------ Main page --------------------------------- */

export function ProductListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const keyword = searchParams.get("keyword") ?? "";
  const categoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;
  const page = Number(searchParams.get("page") ?? 0);

  const [searchDraft, setSearchDraft] = useState(keyword);

  const { data, isLoading, isError, error, refetch } = useProductList({
    keyword: keyword || undefined,
    categoryId,
    page,
    size: PAGE_SIZE,
    sort: "createdAt,desc",
  });

  const { data: categories } = useCategories();

  const push = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === "") params.delete(k);
        else params.set(k, v);
      }
      params.delete("page"); // reset pagination on any filter change
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    push({ keyword: searchDraft });
  };

  const handleCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    push({ categoryId: e.target.value || undefined });
  };

  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/products?${params.toString()}`);
  };

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Products</h1>
        {data && (
          <p className="text-sm text-muted-foreground">
            {data.totalElements} product{data.totalElements !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search products…"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline" size="icon" aria-label="Search">
            <SlidersHorizontal className="size-4" />
          </Button>
        </form>

        <Select
          value={categoryId ? String(categoryId) : ""}
          onChange={handleCategory}
          className="sm:w-44"
        >
          <option value="">All categories</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          {isAppError(error) && error.code === "UNAUTHENTICATED" ? (
            <>
              <p className="text-sm text-muted-foreground">Sign in to browse products.</p>
              <Button size="sm" onClick={() => login("/products")}>
                Sign in
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try again
              </Button>
            </>
          )}
        </div>
      ) : data?.content.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No products found.</p>
          {(keyword || categoryId) && (
            <Button variant="link" size="sm" onClick={() => router.push("/products")}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data?.content.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 0}
            onClick={() => goPage(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages - 1}
            onClick={() => goPage(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
