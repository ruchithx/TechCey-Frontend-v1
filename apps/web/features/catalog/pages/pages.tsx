import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { CategoryNav } from "../components/home/category-nav";
import { CtaBanner } from "../components/home/cta-banner";
import { FeaturedProducts } from "../components/home/featured-products";
import { HeroSection } from "../components/home/hero-section";
import { ValueProps } from "../components/home/value-props";

const OWNER = "Catalog";

export function HomePage() {
  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <HeroSection />
      <ValueProps />
      <CategoryNav />
      <FeaturedProducts />
      <CtaBanner />
    </div>
  );
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
