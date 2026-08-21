import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { env } from "@/core/config/env";
import { TokenShowcase } from "./token-showcase";

export const metadata: Metadata = { title: "Dev · UI tokens — TechCey" };

export default function Page() {
  // Dev-only surface.
  if (!env.isDevelopment) notFound();
  return <TokenShowcase />;
}
