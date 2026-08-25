import type { Metadata } from "next";
import { SignupPage } from "@/features/auth";

export const metadata: Metadata = { title: "Sign up — TechCey" };

export default function Page() {
  return <SignupPage />;
}
