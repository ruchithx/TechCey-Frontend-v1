import type { Metadata } from "next";
import { AuthGuard } from "@/core/auth";
import { CheckoutPage } from "@/features/checkout";

export const metadata: Metadata = { title: "Checkout — TechCey" };

export default function Page() {
  return (
    <AuthGuard>
      <CheckoutPage />
    </AuthGuard>
  );
}
