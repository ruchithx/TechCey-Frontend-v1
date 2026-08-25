"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useProductList } from "../../services/useProductList";
import { ProductCard, ProductCardSkeleton } from "../product-card";

const FEATURED_PAGE_SIZE = 8;

export function FeaturedProducts() {
  const { data, isLoading, isError, error, refetch } = useProductList({
    page: 0,
    size: FEATURED_PAGE_SIZE,
  });

  return (
    <section aria-labelledby="featured-products-heading" className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            id="featured-products-heading"
            className="font-display text-2xl font-bold text-foreground"
          >
            Featured products
          </h2>
          <p className="text-sm text-muted-foreground">Fresh picks from across the catalog.</p>
        </div>
        <Link
          href="/products"
          className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
        >
          View all
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: FEATURED_PAGE_SIZE }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && data && data.content.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          No products available right now. Check back soon.
        </p>
      ) : null}

      {!isLoading && !isError && data && data.content.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.content.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}

      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline sm:hidden"
      >
        View all products
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
