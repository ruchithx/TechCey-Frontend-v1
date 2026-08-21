import type { Metadata } from "next";
import { AdminProductsPage } from "@/features/admin";

export const metadata: Metadata = { title: "Admin · Products — TechCey" };

export default function Page() {
  return <AdminProductsPage />;
}
