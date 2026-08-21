import type { ReactNode } from "react";
import { SiteHeader } from "@/layouts/site-header";
import { SiteFooter } from "@/layouts/site-footer";

/** Storefront shell: header, content, footer. */
export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="container-page flex-1 py-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
