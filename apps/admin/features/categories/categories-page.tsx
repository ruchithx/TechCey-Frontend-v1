"use client";

import { useState } from "react";
import { Tags, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState, EmptyState } from "@/components/shared/data-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/shared/toast";
import { getErrorMessage } from "@/components/shared/error-message";
import type { CategoryResponse } from "@/core/api/types";
import { useCategoryList, useDeleteCategory } from "@/features/categories/hooks";
import { CategoryFormDialog } from "@/features/categories/category-form-dialog";

export function CategoriesPage() {
  const { toast } = useToast();
  const query = useCategoryList();
  const del = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryResponse | undefined>();
  const [deleting, setDeleting] = useState<CategoryResponse | undefined>();

  const categories = query.data ?? [];

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      toast({ title: "Category deleted", description: deleting.name, variant: "success" });
      setDeleting(undefined);
    } catch (error) {
      toast({ title: "Couldn't delete", description: getErrorMessage(error), variant: "destructive" });
    }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organise the catalog taxonomy."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> New category
          </Button>
        }
      />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
        isEmpty={categories.length === 0}
        empty={
          <EmptyState
            title="No categories yet"
            description="Create your first category to group products."
            icon={<Tags className="size-8" />}
          />
        }
      >
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
                  <TableCell className="font-tabular text-muted-foreground">#{category.id}</TableCell>
                  <TableCell className="font-medium text-foreground">{category.name}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">
                    {category.description || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
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
                        size="icon-sm"
                        aria-label="Delete"
                        onClick={() => setDeleting(category)}
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
      </QueryState>

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Delete category?"
        description={
          <>
            Deleting <span className="font-medium">{deleting?.name}</span> may affect products
            assigned to it.
          </>
        }
        confirmLabel="Delete"
        pending={del.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
