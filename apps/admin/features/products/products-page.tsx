"use client";

import { useState } from "react";
import Image from "next/image";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
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
import { PageHeader } from "@/components/shared/page-header";
import { QueryState, EmptyState } from "@/components/shared/data-state";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/shared/toast";
import { getErrorMessage } from "@/components/shared/error-message";
import { formatMoney } from "@/core/api/money";
import { DEFAULT_PAGE_SIZE, PRODUCT_IMAGE_FALLBACK } from "@/core/config/constants";
import type { ProductResponse } from "@/core/api/types";
import { useCategoryList } from "@/features/categories/hooks";
import { useDeleteProduct, useProductList } from "@/features/products/hooks";
import { ProductFormDialog } from "@/features/products/product-form-dialog";

export function ProductsPage() {
  const { toast } = useToast();
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [page, setPage] = useState(0);

  const filters = {
    keyword: keyword.trim() || undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    page,
    size: DEFAULT_PAGE_SIZE,
    sort: "createdAt,desc",
  };

  const query = useProductList(filters);
  const categoriesQuery = useCategoryList();
  const del = useDeleteProduct();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductResponse | undefined>();
  const [deleting, setDeleting] = useState<ProductResponse | undefined>();

  const categories = categoriesQuery.data ?? [];
  const products = query.data?.content ?? [];

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }
  function openEdit(product: ProductResponse) {
    setEditing(product);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      toast({ title: "Product deleted", description: deleting.name, variant: "success" });
      setDeleting(undefined);
    } catch (error) {
      toast({ title: "Couldn't delete", description: getErrorMessage(error), variant: "destructive" });
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage the product catalog — create, edit and remove items."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> New product
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
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

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
        isEmpty={products.length === 0}
        empty={
          <EmptyState
            title="No products found"
            description="Try adjusting your search, or add your first product."
            icon={<Package className="size-8" />}
            action={
              <Button onClick={openCreate}>
                <Plus className="size-4" /> New product
              </Button>
            }
          />
        }
      >
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
                        src={product.imageUrl || PRODUCT_IMAGE_FALLBACK}
                        alt=""
                        width={36}
                        height={36}
                        className="size-9 rounded-md border object-cover"
                        unoptimized
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{product.name}</p>
                        <p className="font-tabular text-xs text-muted-foreground">#{product.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="secondary">{product.category.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-tabular">
                    {formatMoney(String(product.price))}
                  </TableCell>
                  <TableCell className="text-right font-tabular">
                    {product.stock <= 0 ? (
                      <Badge variant="destructive">Out</Badge>
                    ) : (
                      product.stock
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(product)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleting(product)}
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

        <div className="mt-4">
          <Pagination
            page={query.data?.page ?? 0}
            totalPages={query.data?.totalPages ?? 1}
            totalElements={query.data?.totalElements ?? products.length}
            onChange={setPage}
          />
        </div>
      </QueryState>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        categories={categories}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Delete product?"
        description={
          <>
            This permanently removes <span className="font-medium">{deleting?.name}</span> from the
            catalog. This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        pending={del.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
