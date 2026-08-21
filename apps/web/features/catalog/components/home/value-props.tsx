import { Headset, RotateCcw, ShieldCheck, Truck, type LucideIcon } from "lucide-react";

const VALUE_PROPS: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Truck, title: "Free shipping", description: "On orders over $50" },
  { icon: RotateCcw, title: "30-day returns", description: "Hassle-free exchanges" },
  { icon: ShieldCheck, title: "Secure checkout", description: "Encrypted end to end" },
  { icon: Headset, title: "24/7 support", description: "Real humans, real fast" },
];

export function ValueProps() {
  return (
    <section aria-label="Why shop with TechCey" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
        <div
          key={title}
          className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 text-center shadow-e1 sm:flex-row sm:items-start sm:text-left"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
