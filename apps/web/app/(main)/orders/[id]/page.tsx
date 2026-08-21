import type { Metadata } from "next";
import { AuthGuard } from "@/core/auth";
import { OrderDetailPage } from "@/features/orders";

export const metadata: Metadata = { title: "Order — TechCey" };

export default function Page() {
  return (
    <AuthGuard>
      <OrderDetailPage />
    </AuthGuard>
  );
}
