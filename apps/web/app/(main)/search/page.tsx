import type { Metadata } from "next";
import { SearchPage } from "@/features/catalog";

export const metadata: Metadata = { title: "Search — TechCey" };

export default function Page() {
  return <SearchPage />;
}
