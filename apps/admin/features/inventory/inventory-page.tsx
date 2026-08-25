"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, TriangleAlert } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Badge } from "@repo/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState, EmptyState, ErrorState } from "@/components/shared/data-state";
import { InventoryCard } from "@/features/inventory/inventory-card";
import { CreateInventoryDialog } from "@/features/inventory/inventory-dialogs";
import { useInventory, useLowStock } from "@/features/inventory/hooks";

function Lookup() {
  const [input, setInput] = useState("");
  const [productId, setProductId] = useState<number | null>(null);
  const query = useInventory(productId);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-foreground">Look up a product&apos;s inventory</h2>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(input.trim());
          setProductId(Number.isFinite(n) && n > 0 ? n : null);
        }}
      >
        <Input
          placeholder="Product ID"
          inputMode="numeric"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" variant="outline">
          <Search className="size-4" /> Look up
        </Button>
      </form>

      {productId != null ? (
        query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} />
        ) : query.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : query.data ? (
          <InventoryCard inventory={query.data} />
        ) : null
      ) : null}
    </section>
  );
}

export function InventoryPage() {
  const lowStock = useLowStock();
  const [createOpen, setCreateOpen] = useState(false);
  const items = lowStock.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory"
        description="Monitor low stock, run stock takes, and adjust quantities."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New record
          </Button>
        }
      />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <TriangleAlert className="size-4 text-warning" /> Low-stock report
        </h2>
        <QueryState
          isLoading={lowStock.isLoading}
          isError={lowStock.isError}
          error={lowStock.error}
          onRetry={lowStock.refetch}
          isEmpty={items.length === 0}
          empty={
            <EmptyState
              title="Nothing is low on stock"
              description="Every tracked SKU is above its reorder level."
            />
          }
        >
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Reorder at</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-tabular">
                      {item.sku}
                      <span className="ml-2 text-xs text-muted-foreground">#{item.productId}</span>
                    </TableCell>
                    <TableCell className="text-right font-tabular">
                      <Badge variant={item.quantityAvailable <= 0 ? "destructive" : "warning"}>
                        {item.quantityAvailable}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-tabular">{item.quantityOnHand}</TableCell>
                    <TableCell className="text-right font-tabular">{item.reorderLevel}</TableCell>
                    <TableCell className="text-muted-foreground">{item.warehouseCode}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/inventory/${item.productId}`}>Manage</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </QueryState>
      </section>

      <Lookup />

      <CreateInventoryDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
