import type { Metadata } from "next";
import { AuthGuard } from "@/core/auth";
import { AccountPage } from "@/features/account";

export const metadata: Metadata = { title: "Account — TechCey" };

export default function Page() {
  return (
    <AuthGuard>
      <AccountPage />
    </AuthGuard>
  );
}
