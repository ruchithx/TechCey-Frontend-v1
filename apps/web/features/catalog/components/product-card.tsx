import Image from "next/image";
import Link from "next/link";
import { Badge } from "@repo/ui/components/badge";
import { Skeleton } from "@repo/ui/components/skeleton";
import { formatMoney, type ProductResponse } from "@/core/api";
import { PRODUCT_IMAGE_FALLBACK } from "@/core/config/constants";

export function ProductCard({ product }: { product: ProductResponse }) {
  const outOfStock = product.stock <= 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-e1 transition-shadow hover:shadow-e2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
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
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">{product.name}</h3>
        <p className="mt-auto font-tabular text-base font-semibold text-foreground">
          {formatMoney(product.price)}
        </p>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}
