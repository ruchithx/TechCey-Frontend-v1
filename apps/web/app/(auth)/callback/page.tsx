import type { Metadata } from "next";
import { CallbackPage } from "@/features/auth";

export const metadata: Metadata = { title: "Signing in… — TechCey" };

export default function Page() {
  return <CallbackPage />;
}
