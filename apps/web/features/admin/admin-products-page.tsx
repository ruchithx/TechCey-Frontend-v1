"use client";

import { useState } from "react";
import Image from "next/image";
import { Package, Pencil, Plus, Trash2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Select } from "@repo/ui/components/select";
import { Badge } from "@repo/ui/components/badge";
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
import { formatMoney } from "@/core/api/money";
import type { ProductResponse } from "@/core/api/types";
import {
  useAdminCategoryList,
  useAdminProductList,
  useDeleteProduct,
} from "@/features/admin/hooks";
import { ProductFormDialog } from "@/features/admin/product-form-dialog";

const PAGE_SIZE = 20;

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

export function AdminProductsPage() {
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(0);

  const filters = {
    keyword: keyword.trim() || undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    page,
    size: PAGE_SIZE,
    sort: "createdAt,desc",
  };

  const { data, isLoading, isError, refetch } = useAdminProductList(filters);
  const { data: categories = [] } = useAdminCategoryList();
  const del = useDeleteProduct();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductResponse | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<ProductResponse | undefined>();
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  function showToast(message: string, variant: "success" | "error") {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 4000);
  }

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(product: ProductResponse) {
    setEditing(product);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await del.mutateAsync(confirmDelete.id);
      showToast(`"${confirmDelete.name}" deleted`, "success");
      setConfirmDelete(undefined);
    } catch {
      showToast("Couldn't delete product — please try again.", "error");
    }
  }

  const products = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

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
          <h1 className="font-display text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">Manage the catalog — create, edit, delete.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> New product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search products…"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(0);
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(0);
          }}
          className="sm:max-w-xs"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-lg border p-12 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">Failed to load products.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center">
          <Package className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {keyword || categoryId ? "No products match your filters." : "No products yet."}
          </p>
          {!keyword && !categoryId && (
            <Button onClick={openCreate} size="sm">
              <Plus className="size-4" /> Add your first product
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={
                            product.imageUrl ||
                            `https://picsum.photos/seed/product-${product.id}/40/40`
                          }
                          alt=""
                          width={36}
                          height={36}
                          className="size-9 rounded-md border object-cover"
                          unoptimized
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{product.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">#{product.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category?.name ? (
                        <Badge variant="secondary">{product.category.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatMoney(product.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.stock <= 0 ? (
                        <Badge variant="destructive">Out</Badge>
                      ) : (
                        <span className="font-mono">{product.stock}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(product)}
                          aria-label="Edit"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmDelete(product)}
                          aria-label="Delete"
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

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{totalElements} product{totalElements !== 1 ? "s" : ""}</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        categories={categories}
        onSuccess={(msg) => showToast(msg, "success")}
        onError={(msg) => showToast(msg, "error")}
      />

      {/* Delete confirm dialog */}
      <Dialog open={Boolean(confirmDelete)} onOpenChange={(o) => !o && setConfirmDelete(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete product?</DialogTitle>
            <DialogDescription>
              This permanently removes{" "}
              <span className="font-medium">{confirmDelete?.name}</span> from the catalog. This
              cannot be undone.
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
