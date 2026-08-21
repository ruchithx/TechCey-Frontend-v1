/**
 * Placeholder for routed feature pages during the foundation phase (Tier 0).
 * Each route renders one of these showing only its feature/owner name — that is
 * how folder ownership is assigned to the other developers. Real content
 * replaces the placeholder inside each feature, not here.
 */

export function FeaturePlaceholder({
  feature,
  route,
  owner,
}: {
  feature: string;
  route: string;
  owner: string;
}) {
  return (
    <section className="flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {owner} · placeholder
      </p>
      <h1 className="font-display text-3xl font-bold text-foreground">{feature}</h1>
      <code className="font-tabular text-sm text-muted-foreground">{route}</code>
    </section>
  );
}
