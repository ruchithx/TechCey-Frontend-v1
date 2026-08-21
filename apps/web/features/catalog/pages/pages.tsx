import { FeaturePlaceholder } from "@/components/feature-placeholder";

const OWNER = "Catalog";

export function HomePage() {
  return <FeaturePlaceholder feature="Home / Storefront" route="/" owner={OWNER} />;
}
export function ProductListPage() {
  return <FeaturePlaceholder feature="Product Listing" route="/products" owner={OWNER} />;
}
export function ProductDetailPage() {
  return <FeaturePlaceholder feature="Product Detail" route="/products/:id" owner={OWNER} />;
}
export function CategoryPage() {
  return <FeaturePlaceholder feature="Category" route="/categories/:slug" owner={OWNER} />;
}
export function SearchPage() {
  return <FeaturePlaceholder feature="Search" route="/search" owner={OWNER} />;
}
