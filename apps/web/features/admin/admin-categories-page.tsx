"use client";

import { useState } from "react";
import { Tags, Pencil, Plus, Trash2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import type { CategoryResponse } from "@/core/api/types";
import { useAdminCategoryList, useDeleteCategory } from "@/features/admin/hooks";
import { CategoryFormDialog } from "@/features/admin/category-form-dialog";

function Toast({
  message,
  variant,
  onDismiss,
}: {
  message: string;
  variant: "success" | "error";
  onDismiss: () => void;
}) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${
        variant === "success"
          ? "border-green-200 bg-green-50 text-green-900"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
    >
      {variant === "success" ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
      )}
      <span className="text-sm">{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss" className="ml-auto">
        <X className="size-4 opacity-60" />
      </button>
    </div>
  );
}

export function AdminCategoriesPage() {
  const { data: categories = [], isLoading, isError, refetch } = useAdminCategoryList();
  const del = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryResponse | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<CategoryResponse | undefined>();
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  function showToast(message: string, variant: "success" | "error") {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await del.mutateAsync(confirmDelete.id);
      showToast(`"${confirmDelete.name}" deleted`, "success");
      setConfirmDelete(undefined);
    } catch {
      showToast("Couldn't delete category — please try again.", "error");
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground">Organise the catalog taxonomy.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> New category
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-lg border p-12 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">Failed to load categories.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center">
          <Tags className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No categories yet.</p>
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Add your first category
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    #{category.id}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{category.name}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">
                    {category.description || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                        onClick={() => {
                          setEditing(category);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => setConfirmDelete(category)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSuccess={(msg) => showToast(msg, "success")}
        onError={(msg) => showToast(msg, "error")}
      />

      <Dialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              Deleting{" "}
              <span className="font-medium">{confirmDelete?.name}</span> may affect products
              assigned to it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(undefined)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={del.isPending}>
              {del.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
