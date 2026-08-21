import type { Metadata } from "next";
import { CartPage } from "@/features/cart";

export const metadata: Metadata = { title: "Cart — TechCey" };

export default function Page() {
  return <CartPage />;
}
