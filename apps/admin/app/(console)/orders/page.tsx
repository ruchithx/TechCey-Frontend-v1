import type { Metadata } from "next";
import { OrdersPage } from "@/features/orders";

export const metadata: Metadata = { title: "Orders" };

export default function Page() {
  return <OrdersPage />;
}
