import type { ReactNode } from "react";
import { AdminLayout } from "@/layouts/admin-layout";
import { RoleGuard } from "@/core/auth";

/** Every /admin/* route is ADMIN-only — guard once at the group layout. */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={["ADMIN"]}>
      <AdminLayout>{children}</AdminLayout>
    </RoleGuard>
  );
}
