import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@repo/ui/components/button";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
    >
      <div className="flex flex-col gap-6 px-6 py-14 sm:px-10 sm:py-20 lg:max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-widest text-primary-foreground/80">
          New season, new tech
        </p>
        <h1 id="hero-heading" className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Everything you need to build your setup.
        </h1>
        <p className="text-base text-primary-foreground/90 sm:text-lg">
          Laptops, phones, audio and more — curated and ready to ship. Enjoy free shipping on every
          order over $50.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link href="/products">
              Shop all products
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Link href="#categories">Browse categories</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
