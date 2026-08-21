import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { MainLayout } from "@/layouts/main-layout";

export default function NotFound() {
  return (
    <MainLayout>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-tabular text-5xl font-bold text-primary">404</p>
        <h1 className="font-display text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild>
          <Link href="/">Back to shop</Link>
        </Button>
      </div>
    </MainLayout>
  );
}
