import type { Metadata } from "next";
import { LoginPage } from "@/features/auth";

export const metadata: Metadata = { title: "Sign in — TechCey" };

export default function Page() {
  return <LoginPage />;
}
