"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Minus, Plus, ShoppingCart, Star, Zap } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { PRODUCT_IMAGE_FALLBACK } from "@/core/config/constants";
import { formatMoney, request, ENDPOINTS, type OrderResponse } from "@/core/api";
import { toMoney } from "@/core/api/money";
import { useProduct } from "../../services/useProduct";
import { useProductReviews, type ReviewItem } from "../../services/useProductReviews";
import { useAddToCart } from "@/features/cart/services/useAddToCart";
import { CheckoutDialog, type CheckoutItem } from "@/features/checkout/components/checkout-dialog";

/* --------------------------------- Stars ---------------------------------- */

function StarRow({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={`size-4 ${n <= filled ? "fill-amber-400 text-amber-400" : "text-border"}`}
        />
      ))}
    </div>
  );
}

/* ------------------------------ Review card ------------------------------- */

function ReviewCard({ review }: { review: ReviewItem }) {
  const date = new Date(review.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StarRow rating={review.rating} />
            <span className="text-sm font-medium text-foreground">{review.author}</span>
          </div>
          <time className="text-xs text-muted-foreground">{date}</time>
        </div>
        {review.comment ? (
          <p className="text-sm text-foreground">{review.comment}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* ----------------------------- Loading state ------------------------------ */

function ProductDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-5 w-24" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Main component ----------------------------- */

export function ProductDetailPage() {
  const params = useParams();
  const productId = Number(params.id);

  const { data: product, isLoading, isError } = useProduct(productId);
  const { data: reviews } = useProductReviews(productId);
  const addToCart = useAddToCart();

  const [quantity, setQuantity] = useState(1);
  const [cartFeedback, setCartFeedback] = useState<"idle" | "added" | "error">("idle");
  const [cartError, setCartError] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutOrderId, setCheckoutOrderId] = useState("");
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [checkoutTotal, setCheckoutTotal] = useState(toMoney("0.00"));

  const maxQty = product?.stock ?? 99;

  const handleAddToCart = async (andBuy = false) => {
    if (!product) return;
    setCartFeedback("idle");
    setCartError(null);
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity });
      setCartFeedback("added");
      setTimeout(() => setCartFeedback("idle"), 2000);
      if (andBuy) {
        const subtotal = toMoney((parseFloat(product.price) * quantity).toFixed(2));
        const items: CheckoutItem[] = [
          {
            productId: product.id,
            productName: product.name,
            quantity,
            unitPrice: product.price,
            subtotal,
          },
        ];
        let oid = `demo-${Date.now()}`;
        try {
          const order = await request<OrderResponse>(ENDPOINTS.orders.create(), {
            method: "POST",
            body: {
              items: [{ productId: product.id, quantity }],
              shippingAddress: { line1: "TBD", line2: null, city: "TBD", state: "TBD", zip: "00000", country: "LK" },
            },
          });
          oid = String(order.id);
        } catch {
          // fallback order ID
        }
        setCheckoutItems(items);
        setCheckoutTotal(subtotal);
        setCheckoutOrderId(oid);
        setCheckoutOpen(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't add to cart";
      setCartError(msg);
      setCartFeedback("error");
    }
  };

  if (isLoading) return <ProductDetailSkeleton />;

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg font-medium text-foreground">Product not found</p>
        <p className="text-sm text-muted-foreground">
          This product may have been removed or the link is incorrect.
        </p>
        <Button asChild variant="outline">
          <Link href="/products">Back to products</Link>
        </Button>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;
  const categoryName = product.category?.name;

  return (
    <div className="flex flex-col gap-10">
      {/* Back link */}
      <Link
        href="/products"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to products
      </Link>

      {/* Product section */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">

        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary">
          <Image
            src={product.imageUrl ?? PRODUCT_IMAGE_FALLBACK}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
          {outOfStock && (
            <Badge
              variant="outline"
              className="absolute left-3 top-3 bg-background/90"
            >
              Out of stock
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          {/* Category + stock */}
          <div className="flex flex-wrap items-center gap-2">
            {categoryName && (
              <Badge variant="secondary">{categoryName}</Badge>
            )}
            {!outOfStock && (
              <span className="text-xs text-muted-foreground">
                {product.stock} in stock
              </span>
            )}
          </div>

          {/* Name */}
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {product.name}
          </h1>

          {/* Price */}
          <p className="font-tabular text-3xl font-semibold text-foreground">
            {formatMoney(product.price)}
          </p>

          {/* Reviews summary inline */}
          {reviews && reviews.count > 0 && (
            <div className="flex items-center gap-2">
              <StarRow rating={reviews.average} />
              <span className="text-sm text-muted-foreground">
                {reviews.average.toFixed(1)} · {reviews.count} reviews
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Description */}
          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Quantity picker */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Qty</span>
            <div className="flex items-center rounded-md border border-input">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-r-none"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || outOfStock}
                aria-label="Decrease quantity"
              >
                <Minus className="size-3.5" />
              </Button>
              <span className="w-10 text-center text-sm font-medium tabular-nums">
                {quantity}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-l-none"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty || outOfStock}
                aria-label="Increase quantity"
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              disabled={outOfStock || addToCart.isPending}
              onClick={() => handleAddToCart(false)}
            >
              <ShoppingCart className="size-4" aria-hidden />
              {cartFeedback === "added" ? "Added!" : "Add to cart"}
            </Button>
            <Button
              size="lg"
              className="flex-1"
              disabled={outOfStock || addToCart.isPending}
              onClick={() => handleAddToCart(true)}
            >
              <Zap className="size-4" aria-hidden />
              Buy now
            </Button>
          </div>

          {/* Cart error */}
          {cartError && (
            <p className="text-sm text-destructive">{cartError}</p>
          )}

          {outOfStock && (
            <p className="text-sm text-muted-foreground">
              This item is currently out of stock.
            </p>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section aria-labelledby="reviews-heading">
        <div className="mb-5 flex items-center gap-4">
          <h2 id="reviews-heading" className="font-display text-xl font-bold text-foreground">
            Reviews
          </h2>
          {reviews && reviews.count > 0 && (
            <div className="flex items-center gap-2">
              <StarRow rating={reviews.average} />
              <span className="text-sm text-muted-foreground">
                {reviews.average.toFixed(1)} ({reviews.count})
              </span>
            </div>
          )}
        </div>

        {!reviews || reviews.count === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            No reviews yet. Be the first to review this product.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.items.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </section>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={checkoutItems}
        total={checkoutTotal}
        orderId={checkoutOrderId}
      />
    </div>
  );
}
