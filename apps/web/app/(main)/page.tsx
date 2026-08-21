import type { Metadata } from "next";
import { HomePage } from "@/features/catalog";

export const metadata: Metadata = { title: "TechCey — Shop electronics" };

export default function Page() {
  return <HomePage />;
}
