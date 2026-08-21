import type { Metadata } from "next";
import { CategoryPage } from "@/features/catalog";

export const metadata: Metadata = { title: "Category — TechCey" };

export default function Page() {
  return <CategoryPage />;
}
