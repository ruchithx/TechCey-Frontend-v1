import type { Metadata } from "next";
import { AdminCategoriesPage } from "@/features/admin";

export const metadata: Metadata = { title: "Admin · Categories — TechCey" };

export default function Page() {
  return <AdminCategoriesPage />;
}
