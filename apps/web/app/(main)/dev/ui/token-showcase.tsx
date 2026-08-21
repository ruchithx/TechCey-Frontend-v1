/**
 * Visual spec that replaces Figma (D7). Renders every design token: colors,
 * typography scale, spacing, radius, shadow, and z-index. As shared components
 * get built in the next task, add them to this page.
 */

const COLORS: { name: string; className: string; fg: string; light: string; dark: string }[] = [
  { name: "background", className: "bg-background", fg: "text-foreground", light: "#F8FAFC", dark: "#0B1120" },
  { name: "foreground", className: "bg-foreground", fg: "text-background", light: "#0F172A", dark: "#E2E8F0" },
  { name: "card", className: "bg-card", fg: "text-card-foreground", light: "#FFFFFF", dark: "#111827" },
  { name: "primary", className: "bg-primary", fg: "text-primary-foreground", light: "#4F46E5", dark: "#6366F1" },
  { name: "secondary", className: "bg-secondary", fg: "text-secondary-foreground", light: "#F1F5F9", dark: "#1E293B" },
  { name: "muted", className: "bg-muted", fg: "text-muted-foreground", light: "#F1F5F9", dark: "#1E293B" },
  { name: "accent", className: "bg-accent", fg: "text-accent-foreground", light: "#F59E0B", dark: "#FBBF24" },
  { name: "destructive", className: "bg-destructive", fg: "text-destructive-foreground", light: "#DC2626", dark: "#EF4444" },
  { name: "success", className: "bg-success", fg: "text-success-foreground", light: "#16A34A", dark: "#22C55E" },
  { name: "warning", className: "bg-warning", fg: "text-warning-foreground", light: "#D97706", dark: "#F59E0B" },
  { name: "border", className: "bg-border", fg: "text-foreground", light: "#E2E8F0", dark: "#1E293B" },
  { name: "ring", className: "bg-ring", fg: "text-primary-foreground", light: "#4F46E5", dark: "#6366F1" },
];

const TYPE_SCALE = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"] as const;
const RADII = ["sm", "md", "lg", "xl"] as const;
const SHADOWS = ["e1", "e2", "e3"] as const;
const SPACING = [1, 2, 3, 4, 6, 8, 12, 16] as const;
const ZINDEX = ["dropdown", "sticky", "overlay", "modal", "toast"] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function TokenShowcase() {
  return (
    <div className="flex flex-col gap-12 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-4xl font-bold text-foreground">Design tokens</h1>
        <p className="text-muted-foreground">
          The single source of truth for TechCey&apos;s visual language. Toggle{" "}
          <code className="font-tabular">.dark</code> on <code className="font-tabular">&lt;html&gt;</code> to preview dark mode.
        </p>
      </header>

      <Section title="Color">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {COLORS.map((c) => (
            <div key={c.name} className="overflow-hidden rounded-lg border border-border">
              <div className={`flex h-20 items-end p-2 ${c.className} ${c.fg}`}>
                <span className="text-xs font-medium">{c.name}</span>
              </div>
              <div className="flex justify-between bg-card px-2 py-1 font-tabular text-xs text-muted-foreground">
                <span>{c.light}</span>
                <span className="opacity-60">{c.dark}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-2">
          {TYPE_SCALE.map((size) => (
            <div key={size} className="flex items-baseline gap-4 border-b border-border pb-2">
              <code className="font-tabular w-16 text-xs text-muted-foreground">text-{size}</code>
              <span className={`text-${size} text-foreground`}>The quick brown fox — TechCey</span>
            </div>
          ))}
          <div className="flex items-baseline gap-4 pt-2">
            <code className="font-tabular w-16 text-xs text-muted-foreground">tabular</code>
            <span className="font-tabular text-lg text-foreground">$1,299.00 · SKU-0042 · ORD-1707-A1B2</span>
          </div>
        </div>
      </Section>

      <Section title="Radius">
        <div className="flex flex-wrap gap-4">
          {RADII.map((r) => (
            <div key={r} className="flex flex-col items-center gap-1">
              <div className={`size-20 border border-border bg-secondary rounded-${r}`} />
              <code className="font-tabular text-xs text-muted-foreground">rounded-{r}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Shadow">
        <div className="flex flex-wrap gap-6">
          {SHADOWS.map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className={`size-24 rounded-lg bg-card shadow-${s}`} />
              <code className="font-tabular text-xs text-muted-foreground">shadow-{s}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing">
        <div className="flex flex-col gap-2">
          {SPACING.map((s) => (
            <div key={s} className="flex items-center gap-3">
              <code className="font-tabular w-12 text-xs text-muted-foreground">{s}</code>
              <div className="h-4 bg-primary" style={{ width: `calc(var(--spacing) * ${s})` }} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Z-index scale">
        <div className="flex flex-wrap gap-3">
          {ZINDEX.map((z) => (
            <span key={z} className="rounded-md border border-border bg-secondary px-3 py-2 font-tabular text-xs text-secondary-foreground">
              z-{z}
            </span>
          ))}
        </div>
      </Section>
    </div>
  );
}
