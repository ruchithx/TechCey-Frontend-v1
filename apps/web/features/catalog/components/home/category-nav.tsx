"use client";

import Link from "next/link";
import {
  Headphones,
  Keyboard,
  Laptop,
  Monitor,
  ShoppingBag,
  Smartphone,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@repo/ui/components/skeleton";
import type { CategoryResponse } from "@/core/api";
import { useCategories } from "../../services/useCategories";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Laptops: Laptop,
  Phones: Smartphone,
  Audio: Headphones,
  Peripherals: Keyboard,
  Displays: Monitor,
  Wearables: Watch,
};

function iconFor(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? ShoppingBag;
}

export function CategoryNav() {
  const { data: categories, isLoading, isError, error, refetch } = useCategories();

  return (
    <section id="categories" aria-labelledby="category-nav-heading" className="flex flex-col gap-4">
      <h2 id="category-nav-heading" className="font-display text-2xl font-bold text-foreground">
        Shop by category
      </h2>

      {isLoading ? <CategoryNavSkeleton /> : null}

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

      {!isLoading && !isError && categories?.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          No categories available right now.
        </p>
      ) : null}

      {!isLoading && !isError && categories && categories.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <li key={category.id}>
              <CategoryTile category={category} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function CategoryTile({ category }: { category: CategoryResponse }) {
  const Icon = iconFor(category.name);
  return (
    <Link
      href={`/products?categoryId=${category.id}`}
      className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 text-center shadow-e1 transition-colors hover:border-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="text-sm font-medium text-foreground">{category.name}</span>
    </Link>
  );
}

function CategoryNavSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4"
        >
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </li>
      ))}
    </ul>
  );
}
