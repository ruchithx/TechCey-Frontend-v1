"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ShoppingCart, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Badge } from "@repo/ui/components/badge";
import { Select } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { formatMoney, type ProductResponse } from "@/core/api";
import { PRODUCT_IMAGE_FALLBACK } from "@/core/config/constants";
import { useProductList } from "../../services/useProductList";
import { useCategories } from "../../services/useCategories";
import { useAddToCart } from "@/features/cart/services/useAddToCart";

const PAGE_SIZE = 12;

/* ------------------------------ Product card ------------------------------ */

function ProductListCard({ product }: { product: ProductResponse }) {
  const addToCart = useAddToCart();
  const [feedback, setFeedback] = useState<"idle" | "added" | "error">("idle");
  const outOfStock = product.stock <= 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault(); // don't navigate via the parent link
    setFeedback("idle");
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
      setFeedback("added");
      setTimeout(() => setFeedback("idle"), 1800);
    } catch {
      setFeedback("error");
      setTimeout(() => setFeedback("idle"), 2500);
    }
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-e1 transition-shadow hover:shadow-e2">
      {/* Image + name → product detail */}
      <Link href={`/products/${product.id}`} className="flex flex-col flex-1">
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <Image
            src={product.imageUrl ?? PRODUCT_IMAGE_FALLBACK}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {outOfStock && (
            <Badge variant="outline" className="absolute left-2 top-2 bg-background/90">
              Out of stock
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-1 p-3">
          <h3 className="line-clamp-2 text-sm font-medium text-foreground">{product.name}</h3>
          <p className="mt-auto font-tabular text-base font-semibold text-foreground">
            {formatMoney(product.price)}
          </p>
        </div>
      </Link>

      {/* Add to cart — outside the Link so it doesn't navigate */}
      <div className="px-3 pb-3">
        <Button
          size="sm"
          variant={feedback === "added" ? "default" : "outline"}
          className="w-full"
          disabled={outOfStock || addToCart.isPending}
          onClick={handleAdd}
        >
          <ShoppingCart className="size-3.5" aria-hidden />
          {feedback === "added"
            ? "Added!"
            : feedback === "error"
              ? "Failed — retry"
              : outOfStock
                ? "Out of stock"
                : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}

function ProductListCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-full mt-1" />
      </div>
    </div>
  );
}

/* ------------------------------ Main page --------------------------------- */

export function ProductListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
            <ProductListCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
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
            <ProductListCard key={product.id} product={product} />
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
