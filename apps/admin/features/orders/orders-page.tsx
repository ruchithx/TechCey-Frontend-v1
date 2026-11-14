"use client";

import { useState } from "react";
import { Info, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { PageHeader } from "@/components/shared/page-header";
import { Field } from "@/components/shared/form-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/shared/toast";
import { getErrorMessage } from "@/components/shared/error-message";
import { useDeleteOrder } from "@/features/orders/hooks";

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function OrdersPage() {
  const { toast } = useToast();
  const del = useDeleteOrder();
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = orderId.trim();
    if (!UUID_RE.test(id)) {
      setError("Enter a valid order UUID.");
      return;
    }
    setError(undefined);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    try {
      await del.mutateAsync(orderId.trim());
      toast({ title: "Order deleted", description: orderId.trim(), variant: "success" });
      setOrderId("");
      setConfirmOpen(false);
    } catch (err) {
      toast({ title: "Couldn't delete order", description: getErrorMessage(err), variant: "destructive" });
      setConfirmOpen(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Administrative order actions."
      />

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          The order service does not expose an admin “list all orders” endpoint — order reads are
          scoped to each customer. The only admin capability is permanently deleting an order by its
          ID.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="size-4 text-destructive" /> Delete an order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Order ID (UUID)" htmlFor="order-id" required error={error}>
              <Input
                id="order-id"
                placeholder="a1b2c3d4-…"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="font-tabular"
              />
            </Field>
            <Button type="submit" variant="destructive" disabled={!orderId.trim()}>
              <Trash2 className="size-4" /> Delete order
            </Button>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this order?"
        description={
          <>
            This permanently deletes order{" "}
            <span className="font-tabular font-medium">{orderId.trim()}</span>. This cannot be
            undone.
          </>
        }
        confirmLabel="Delete order"
        pending={del.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
