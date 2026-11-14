import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { CategoryNav } from "../components/home/category-nav";
import { CtaBanner } from "../components/home/cta-banner";
import { FeaturedProducts } from "../components/home/featured-products";
import { HeroSection } from "../components/home/hero-section";
import { ValueProps } from "../components/home/value-props";
import { ProductDetailPage as ProductDetail } from "../components/product-detail/product-detail-page";
import { ProductListPage as ProductList } from "../components/product-list/product-list-page";

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
  return <ProductList />;
}
export function ProductDetailPage() {
  return <ProductDetail />;
}
export function CategoryPage() {
  return <FeaturePlaceholder feature="Category" route="/categories/:slug" owner={OWNER} />;
}
export function SearchPage() {
  return <FeaturePlaceholder feature="Search" route="/search" owner={OWNER} />;
}
