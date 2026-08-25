import Link from "next/link";
import { Button } from "@repo/ui/components/button";

export function CtaBanner() {
  return (
    <section className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-e1">
      <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
        Ready to upgrade your setup?
      </h2>
      <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
        Browse the full catalog and find the gear that fits your workflow — from ultrabooks to
        studio-grade audio.
      </p>
      <Button asChild size="lg">
        <Link href="/products">Start shopping</Link>
      </Button>
    </section>
  );
}
