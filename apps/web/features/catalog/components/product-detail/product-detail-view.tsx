"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Skeleton } from "@repo/ui/components/skeleton";
import { formatMoney } from "@/core/api";
import { useAuth } from "@/core/auth";
import { PRODUCT_IMAGE_FALLBACK } from "@/core/config/constants";
import { ErrorState } from "@/components/shared/data-state";
import { useToast } from "@/components/shared/toast";
import { getErrorMessage } from "@/components/shared/error-message";
import { useProduct } from "../../services/useProduct";
import { useAvailability } from "../../services/useAvailability";
import { useAddToCart } from "../../services/useAddToCart";
import { ReviewSection } from "./review-section";

export function ProductDetailView() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const productQuery = useProduct(id);
  const availabilityQuery = useAvailability(id);
  const addToCart = useAddToCart();
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  if (productQuery.isLoading) return <ProductDetailSkeleton />;
  if (productQuery.isError) return <ErrorState error={productQuery.error} onRetry={productQuery.refetch} />;
  if (!productQuery.data) return null;

  const product = productQuery.data;
  // inventory-service reflects reservations; fall back to product-service's
  // own snapshot while that call is in flight or if it 404s (no record yet).
  const available = availabilityQuery.data?.quantityAvailable ?? product.stock;
  const inStock = availabilityQuery.data?.inStock ?? product.stock > 0;

  async function handleAddToCart() {
    if (!isAuthenticated) {
      login(`/products/${id}`);
      return;
    }
    try {
      await addToCart.mutateAsync({ productId: id, quantity });
      toast({ title: "Added to cart", description: `${product.name} × ${quantity}`, variant: "success" });
    } catch (error) {
      toast({ title: "Couldn't add to cart", description: getErrorMessage(error), variant: "destructive" });
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
          <Image
            src={product.imageUrl ?? PRODUCT_IMAGE_FALLBACK}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 45vw, 90vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <Badge variant="secondary">{product.category.name}</Badge>
            <h1 className="mt-2 font-display text-3xl font-bold text-foreground">{product.name}</h1>
          </div>

          <p className="font-tabular text-2xl font-semibold text-foreground">{formatMoney(product.price)}</p>

          {product.description ? <p className="text-sm text-muted-foreground">{product.description}</p> : null}

          <div>
            {inStock ? (
              <Badge variant="success">
                {available <= 5 ? `Only ${available} left in stock` : "In stock"}
              </Badge>
            ) : (
              <Badge variant="destructive">Out of stock</Badge>
            )}
          </div>

          {inStock ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-md border border-border">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="size-3.5" />
                </Button>
                <span className="w-8 text-center font-tabular text-sm">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(available, q + 1))}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
              <Button size="lg" onClick={handleAddToCart} disabled={addToCart.isPending} className="flex-1">
                <ShoppingCart className="size-4" />
                {addToCart.isPending ? "Adding…" : "Add to cart"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <ReviewSection productId={id} />
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
