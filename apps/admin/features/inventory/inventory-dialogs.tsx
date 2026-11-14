"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Select } from "@repo/ui/components/select";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/components/shared/toast";
import { applyFieldErrors } from "@/components/shared/apply-field-errors";
import { getErrorMessage } from "@/components/shared/error-message";
import { isAppError } from "@/core/errors/app-error";
import { ADJUST_REASONS, type InventoryResponse } from "@/core/api/types";
import {
  useAdjustStock,
  useCreateInventory,
  useSetStock,
  useUpdateReorderLevel,
} from "@/features/inventory/hooks";
import {
  adjustSchema,
  createInventorySchema,
  reorderSchema,
  setStockSchema,
  type AdjustValues,
  type CreateInventoryValues,
  type ReorderValues,
  type SetStockValues,
} from "@/features/inventory/schema";

/** A 409 from inventory is expected UX (below-reserved, duplicate) — surface it kindly. */
function feedbackFor(error: unknown): { title: string; description: string } {
  if (isAppError(error) && error.status === 409) {
    return { title: "Conflict", description: error.message };
  }
  return { title: "Something went wrong", description: getErrorMessage(error) };
}

/* ------------------------------ create record ------------------------------ */

export function CreateInventoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const create = useCreateInventory();
  const form = useForm<CreateInventoryValues>({
    resolver: zodResolver(createInventorySchema),
    defaultValues: { productId: "", sku: "", quantityOnHand: "0", reorderLevel: "", warehouseCode: "" },
  });

  useEffect(() => {
    if (open) form.reset({ productId: "", sku: "", quantityOnHand: "0", reorderLevel: "", warehouseCode: "" });
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync({
        productId: Number(values.productId),
        sku: values.sku.trim(),
        quantityOnHand: Number(values.quantityOnHand),
        reorderLevel: values.reorderLevel ? Number(values.reorderLevel) : undefined,
        warehouseCode: values.warehouseCode?.trim() || undefined,
      });
      toast({ title: "Inventory record created", description: `SKU ${values.sku}`, variant: "success" });
      onOpenChange(false);
    } catch (error) {
      if (!applyFieldErrors(error, form.setError, ["productId", "sku", "quantityOnHand", "reorderLevel", "warehouseCode"])) {
        const f = feedbackFor(error);
        toast({ title: f.title, description: f.description, variant: "destructive" });
      }
    }
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New inventory record</DialogTitle>
          <DialogDescription>Start tracking stock for a product.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Product ID" htmlFor="inv-pid" required error={errors.productId?.message}>
              <Input id="inv-pid" inputMode="numeric" {...form.register("productId")} />
            </Field>
            <Field label="SKU" htmlFor="inv-sku" required error={errors.sku?.message}>
              <Input id="inv-sku" {...form.register("sku")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantity on hand" htmlFor="inv-qty" required error={errors.quantityOnHand?.message}>
              <Input id="inv-qty" inputMode="numeric" {...form.register("quantityOnHand")} />
            </Field>
            <Field label="Reorder level" htmlFor="inv-reorder" hint="Default 10" error={errors.reorderLevel?.message}>
              <Input id="inv-reorder" inputMode="numeric" placeholder="10" {...form.register("reorderLevel")} />
            </Field>
          </div>
          <Field label="Warehouse code" htmlFor="inv-wh" hint="Default MAIN" error={errors.warehouseCode?.message}>
            <Input id="inv-wh" placeholder="MAIN" {...form.register("warehouseCode")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------- set stock -------------------------------- */

export function SetStockDialog({
  open,
  onOpenChange,
  inventory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: InventoryResponse;
}) {
  const { toast } = useToast();
  const setStock = useSetStock();
  const form = useForm<SetStockValues>({
    resolver: zodResolver(setStockSchema),
    defaultValues: { quantityOnHand: String(inventory.quantityOnHand), note: "" },
  });

  useEffect(() => {
    if (open) form.reset({ quantityOnHand: String(inventory.quantityOnHand), note: "" });
  }, [open, inventory, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await setStock.mutateAsync({
        productId: inventory.productId,
        body: { quantityOnHand: Number(values.quantityOnHand), note: values.note?.trim() || undefined },
      });
      toast({ title: "Stock updated", description: `On hand set to ${values.quantityOnHand}`, variant: "success" });
      onOpenChange(false);
    } catch (error) {
      const f = feedbackFor(error);
      toast({ title: f.title, description: f.description, variant: "destructive" });
    }
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set absolute stock</DialogTitle>
          <DialogDescription>
            Stock take for SKU {inventory.sku}. {inventory.quantityReserved} units are reserved and
            cannot be undercut.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Quantity on hand" htmlFor="set-qty" required error={errors.quantityOnHand?.message}>
            <Input id="set-qty" inputMode="numeric" {...form.register("quantityOnHand")} />
          </Field>
          <Field label="Note" htmlFor="set-note" error={errors.note?.message}>
            <Textarea id="set-note" rows={2} placeholder="Q3 stock take, warehouse A" {...form.register("note")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={setStock.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={setStock.isPending}>
              {setStock.isPending ? "Saving…" : "Set stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- adjust stock ------------------------------ */

export function AdjustStockDialog({
  open,
  onOpenChange,
  inventory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: InventoryResponse;
}) {
  const { toast } = useToast();
  const adjust = useAdjustStock();
  const form = useForm<AdjustValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { delta: "", reason: "CORRECTION", note: "" },
  });

  useEffect(() => {
    if (open) form.reset({ delta: "", reason: "CORRECTION", note: "" });
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await adjust.mutateAsync({
        productId: inventory.productId,
        body: { delta: Number(values.delta), reason: values.reason, note: values.note?.trim() || undefined },
      });
      toast({ title: "Stock adjusted", description: `${values.delta} (${values.reason})`, variant: "success" });
      onOpenChange(false);
    } catch (error) {
      const f = feedbackFor(error);
      toast({ title: f.title, description: f.description, variant: "destructive" });
    }
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            Relative change for SKU {inventory.sku}. Use a negative delta to remove units.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Delta" htmlFor="adj-delta" required hint="e.g. -5 or 12" error={errors.delta?.message}>
              <Input id="adj-delta" inputMode="numeric" {...form.register("delta")} />
            </Field>
            <Field label="Reason" htmlFor="adj-reason" required error={errors.reason?.message}>
              <Select id="adj-reason" {...form.register("reason")}>
                {ADJUST_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Note" htmlFor="adj-note" error={errors.note?.message}>
            <Textarea id="adj-note" rows={2} placeholder="Water damage, pallet 7" {...form.register("note")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={adjust.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={adjust.isPending}>
              {adjust.isPending ? "Applying…" : "Apply adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- reorder level ------------------------------ */

export function ReorderLevelDialog({
  open,
  onOpenChange,
  inventory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: InventoryResponse;
}) {
  const { toast } = useToast();
  const update = useUpdateReorderLevel();
  const form = useForm<ReorderValues>({
    resolver: zodResolver(reorderSchema),
    defaultValues: { reorderLevel: String(inventory.reorderLevel) },
  });

  useEffect(() => {
    if (open) form.reset({ reorderLevel: String(inventory.reorderLevel) });
  }, [open, inventory, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        productId: inventory.productId,
        body: { reorderLevel: Number(values.reorderLevel) },
      });
      toast({ title: "Reorder level updated", description: `New level ${values.reorderLevel}`, variant: "success" });
      onOpenChange(false);
    } catch (error) {
      const f = feedbackFor(error);
      toast({ title: f.title, description: f.description, variant: "destructive" });
    }
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update reorder level</DialogTitle>
          <DialogDescription>
            The low-stock threshold for SKU {inventory.sku}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Reorder level" htmlFor="reorder-level" required error={errors.reorderLevel?.message}>
            <Input id="reorder-level" inputMode="numeric" {...form.register("reorderLevel")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={update.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Update level"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
