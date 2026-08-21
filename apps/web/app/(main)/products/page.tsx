import type { Metadata } from "next";
import { ProductListPage } from "@/features/catalog";

export const metadata: Metadata = { title: "Products — TechCey" };

export default function Page() {
  return <ProductListPage />;
}
