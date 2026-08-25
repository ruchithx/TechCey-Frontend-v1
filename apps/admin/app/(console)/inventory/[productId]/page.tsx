import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InventoryDetailPage } from "@/features/inventory";

export const metadata: Metadata = { title: "Inventory detail" };

export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const id = Number(productId);
  if (!Number.isFinite(id) || id <= 0) notFound();
  return <InventoryDetailPage productId={id} />;
}
