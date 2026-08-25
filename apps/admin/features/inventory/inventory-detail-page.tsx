"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Select } from "@repo/ui/components/select";
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
import { Pagination } from "@/components/shared/pagination";
import { Skeleton } from "@repo/ui/components/skeleton";
import { formatDateTime } from "@/components/shared/format";
import { LEDGER_PAGE_SIZE } from "@/core/config/constants";
import { MOVEMENT_TYPES, type MovementType } from "@/core/api/types";
import { InventoryCard } from "@/features/inventory/inventory-card";
import { useInventory, useMovements } from "@/features/inventory/hooks";

export function InventoryDetailPage({ productId }: { productId: number }) {
  const inventory = useInventory(productId);
  const [movementType, setMovementType] = useState<MovementType | "">("");
  const [page, setPage] = useState(0);

  const movements = useMovements(productId, {
    movementType: movementType || undefined,
    page,
    size: LEDGER_PAGE_SIZE,
  });

  const rows = movements.data?.content ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Inventory · Product #${productId}`}
        description="Live quantities and the full stock movement ledger."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/inventory">
              <ArrowLeft className="size-4" /> Back
            </Link>
          </Button>
        }
      />

      {inventory.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : inventory.isError ? (
        <ErrorState error={inventory.error} onRetry={inventory.refetch} />
      ) : inventory.data ? (
        <InventoryCard inventory={inventory.data} showMovementsLink={false} />
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-foreground">Movement ledger</h2>
          <Select
            value={movementType}
            onChange={(e) => {
              setMovementType(e.target.value as MovementType | "");
              setPage(0);
            }}
            className="max-w-[12rem]"
          >
            <option value="">All movement types</option>
            {MOVEMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>

        <QueryState
          isLoading={movements.isLoading}
          isError={movements.isError}
          error={movements.error}
          onRetry={movements.refetch}
          isEmpty={rows.length === 0}
          empty={<EmptyState title="No movements recorded" />}
        >
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Delta</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(m.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{m.movementType}</Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-tabular ${m.quantityDelta < 0 ? "text-destructive" : "text-success"}`}
                    >
                      {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                    </TableCell>
                    <TableCell className="text-right font-tabular">{m.onHandAfter}</TableCell>
                    <TableCell className="text-right font-tabular">{m.reservedAfter}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.reason || "—"}
                      {m.note ? <span className="block text-xs">{m.note}</span> : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.referenceType ? (
                        <span className="font-tabular text-xs">
                          {m.referenceType}
                          {m.referenceId ? `:${m.referenceId.slice(0, 8)}` : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4">
            <Pagination
              page={movements.data?.page ?? 0}
              totalPages={movements.data?.totalPages ?? 1}
              totalElements={movements.data?.totalElements ?? rows.length}
              onChange={setPage}
            />
          </div>
        </QueryState>
      </section>
    </div>
  );
}
