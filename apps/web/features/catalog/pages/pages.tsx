import { CategoryNav } from "../components/home/category-nav";
import { CtaBanner } from "../components/home/cta-banner";
import { FeaturedProducts } from "../components/home/featured-products";
import { HeroSection } from "../components/home/hero-section";
import { ValueProps } from "../components/home/value-props";
import { ProductListView } from "../components/product-list/product-list-view";
import { ProductDetailView } from "../components/product-detail/product-detail-view";
import { CategoryDetailView } from "../components/category/category-detail-view";

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
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-foreground">All products</h1>
      <ProductListView />
    </div>
  );
}

export function ProductDetailPage() {
  return <ProductDetailView />;
}

export function CategoryPage() {
  return <CategoryDetailView />;
}

export function SearchPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Search</h1>
      <ProductListView />
    </div>
  );
}
