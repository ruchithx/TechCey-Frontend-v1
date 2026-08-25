import type { Metadata } from "next";
import { TemplatesPage } from "@/features/templates";

export const metadata: Metadata = { title: "Templates" };

export default function Page() {
  return <TemplatesPage />;
}
