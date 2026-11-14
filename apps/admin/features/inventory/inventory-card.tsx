"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList, Gauge, Package2, SlidersHorizontal } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import type { InventoryResponse } from "@/core/api/types";
import {
  AdjustStockDialog,
  ReorderLevelDialog,
  SetStockDialog,
} from "@/features/inventory/inventory-dialogs";

function Stat({ label, value, muted }: { label: string; value: string | number; muted?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-tabular text-lg font-semibold ${muted ? "text-muted-foreground" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

/** Full inventory summary for one product with the four management actions. */
export function InventoryCard({
  inventory,
  showMovementsLink = true,
}: {
  inventory: InventoryResponse;
  showMovementsLink?: boolean;
}) {
  const [setOpen, setSetOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="size-4 text-muted-foreground" />
            SKU <span className="font-tabular">{inventory.sku}</span>
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Product #{inventory.productId} · Warehouse {inventory.warehouseCode}
          </p>
        </div>
        <div className="flex gap-2">
          {inventory.lowStock ? <Badge variant="warning">Low stock</Badge> : null}
          {inventory.inStock ? (
            <Badge variant="success">In stock</Badge>
          ) : (
            <Badge variant="destructive">Out of stock</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="On hand" value={inventory.quantityOnHand} />
          <Stat label="Reserved" value={inventory.quantityReserved} muted />
          <Stat label="Available" value={inventory.quantityAvailable} />
          <Stat label="Reorder at" value={inventory.reorderLevel} muted />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setSetOpen(true)}>
            <Package2 className="size-4" /> Set stock
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAdjustOpen(true)}>
            <SlidersHorizontal className="size-4" /> Adjust
          </Button>
          <Button variant="outline" size="sm" onClick={() => setReorderOpen(true)}>
            <Gauge className="size-4" /> Reorder level
          </Button>
          {showMovementsLink ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/inventory/${inventory.productId}`}>
                <ClipboardList className="size-4" /> Movements
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>

      <SetStockDialog open={setOpen} onOpenChange={setSetOpen} inventory={inventory} />
      <AdjustStockDialog open={adjustOpen} onOpenChange={setAdjustOpen} inventory={inventory} />
      <ReorderLevelDialog open={reorderOpen} onOpenChange={setReorderOpen} inventory={inventory} />
    </Card>
  );
}
