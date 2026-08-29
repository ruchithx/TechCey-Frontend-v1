import type { ReactNode } from "react";
import { MainLayout } from "@/layouts/main-layout";
import { CartBadge } from "@/features/cart";
import { HeaderSearch } from "@/features/catalog";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <MainLayout cartBadge={<CartBadge />} searchSlot={<HeaderSearch />}>
      {children}
    </MainLayout>
  );
}
