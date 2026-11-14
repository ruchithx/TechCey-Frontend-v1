"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Skeleton } from "@repo/ui/components/skeleton";
import { formatMoney, type ProductResponse } from "@/core/api";
import { PRODUCT_IMAGE_FALLBACK } from "@/core/config/constants";
import { useAddToCart } from "@/core/cart";

export function ProductCard({ product }: { product: ProductResponse }) {
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
          {outOfStock ? (
            <Badge variant="outline" className="absolute left-2 top-2 bg-background/90">
              Out of stock
            </Badge>
          ) : null}
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

export function ProductCardSkeleton() {
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
