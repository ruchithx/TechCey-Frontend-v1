import type { Metadata } from "next";
import { ProductDetailPage } from "@/features/catalog";

export const metadata: Metadata = { title: "Product — TechCey" };

export default function Page() {
  return <ProductDetailPage />;
}
