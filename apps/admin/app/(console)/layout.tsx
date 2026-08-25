import type { ReactNode } from "react";
import { RoleGuard } from "@/core/auth";
import { AdminLayout } from "@/layouts/admin-layout";

/** The whole console is ADMIN-only — guard once here, then render the shell. */
export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={["ADMIN"]}>
      <AdminLayout>{children}</AdminLayout>
    </RoleGuard>
  );
}
