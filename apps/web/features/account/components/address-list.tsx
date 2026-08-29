"use client";

import { useState } from "react";
import { MapPin, Plus, Star } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { EmptyState, ErrorState } from "@/components/shared/data-state";
import { useToast } from "@/components/shared/toast";
import { getErrorMessage } from "@/components/shared/error-message";
import type { AddressRequest, AddressResponse } from "@/core/api";
import {
  useAddAddress,
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
  useUpdateAddress,
} from "../services/useAddresses";
import { AddressForm } from "./address-form";

type Editing = { mode: "add" } | { mode: "edit"; address: AddressResponse } | null;

/**
 * The customer's saved-address book, backed by
 * `/api/v1/customers/me/addresses`. Supports list, add, edit, delete and
 * set-default. Loading / empty / error states are all handled; mutations
 * invalidate the customer cache so the default flag stays authoritative.
 */
export function AddressList() {
  const { toast } = useToast();
  const query = useAddresses();
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [editing, setEditing] = useState<Editing>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const addresses = query.data ?? [];

  async function handleSubmit(body: AddressRequest) {
    if (editing?.mode === "edit") {
      await updateAddress.mutateAsync({ id: editing.address.id, body });
      toast({ title: "Address updated", variant: "success" });
    } else {
      await addAddress.mutateAsync(body);
      toast({ title: "Address added", variant: "success" });
    }
    setEditing(null);
  }

  async function handleDelete(id: string) {
    try {
      await deleteAddress.mutateAsync(id);
      toast({ title: "Address removed", variant: "success" });
    } catch (error) {
      toast({
        title: "Couldn't remove the address",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await setDefault.mutateAsync(id);
      toast({ title: "Default address updated", variant: "success" });
    } catch (error) {
      toast({
        title: "Couldn't set the default address",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-foreground">Addresses</h2>
        <Button variant="outline" size="sm" onClick={() => setEditing({ mode: "add" })}>
          <Plus className="size-4" />
          Add address
        </Button>
      </div>

      {query.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : addresses.length === 0 ? (
        <EmptyState
          title="No saved addresses"
          description="Add an address to reuse it at checkout."
          icon={<MapPin className="size-8" />}
          action={
            <Button variant="outline" size="sm" onClick={() => setEditing({ mode: "add" })}>
              <Plus className="size-4" />
              Add address
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {address.label || "Address"}
                  </span>
                  {address.isDefault ? (
                    <Badge variant="secondary">
                      <Star className="size-3" />
                      Default
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[address.line1, address.line2, address.city, address.state, address.zip, address.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {!address.isDefault ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(address.id)}
                    disabled={setDefault.isPending}
                  >
                    Set default
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing({ mode: "edit", address })}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingDeleteId(address.id)}
                  disabled={deleteAddress.isPending}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* add / edit dialog */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.mode === "edit" ? "Edit address" : "Add address"}</DialogTitle>
            <DialogDescription>
              Saved addresses are yours only and are separate from any address already used on a
              placed order.
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <AddressForm
              address={editing.mode === "edit" ? editing.address : undefined}
              pending={addAddress.isPending || updateAddress.isPending}
              onSubmit={handleSubmit}
              onCancel={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* delete confirm dialog */}
      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this address?</DialogTitle>
            <DialogDescription>This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setPendingDeleteId(null)}
              disabled={deleteAddress.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => pendingDeleteId && handleDelete(pendingDeleteId)}
              disabled={deleteAddress.isPending}
            >
              {deleteAddress.isPending ? "Removing…" : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
