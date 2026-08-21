import type { Metadata } from "next";
import { AuthGuard } from "@/core/auth";
import { OrderListPage } from "@/features/orders";

export const metadata: Metadata = { title: "Your orders — TechCey" };

export default function Page() {
  return (
    <AuthGuard>
      <OrderListPage />
    </AuthGuard>
  );
}
