"use client";

import { useState } from "react";
import { Eye, FileText, Pencil, Plus, Power } from "lucide-react";
import { Button } from "@repo/ui/components/button";
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
import { DEFAULT_PAGE_SIZE } from "@/core/config/constants";
import type { TemplateResponse } from "@/core/api/types";
import { useDeactivateTemplate, useTemplateList } from "@/features/templates/hooks";
import { TemplateFormDialog } from "@/features/templates/template-form-dialog";
import { TemplatePreviewDialog } from "@/features/templates/template-preview-dialog";

export function TemplatesPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const query = useTemplateList({ page, size: DEFAULT_PAGE_SIZE });
  const deactivate = useDeactivateTemplate();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateResponse | undefined>();
  const [previewing, setPreviewing] = useState<TemplateResponse | null>(null);
  const [deactivating, setDeactivating] = useState<TemplateResponse | undefined>();

  const rows = query.data?.content ?? [];

  async function confirmDeactivate() {
    if (!deactivating) return;
    try {
      await deactivate.mutateAsync(deactivating.id);
      toast({ title: "Template deactivated", description: deactivating.code, variant: "success" });
      setDeactivating(undefined);
    } catch (error) {
      toast({ title: "Couldn't deactivate", description: getErrorMessage(error), variant: "destructive" });
    }
  }

  return (
    <div>
      <PageHeader
        title="Notification templates"
        description="Author and preview the templates used for emails, SMS and in-app messages."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> New template
          </Button>
        }
      />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
        isEmpty={rows.length === 0}
        empty={
          <EmptyState
            title="No templates yet"
            description="Create your first notification template."
            icon={<FileText className="size-8" />}
          />
        }
      >
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Locale</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-tabular text-xs font-medium text-foreground">{t.code}</TableCell>
                  <TableCell>{t.channel}</TableCell>
                  <TableCell className="text-muted-foreground">{t.locale}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.contentType}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-tabular">v{t.versionNo}</TableCell>
                  <TableCell>
                    {t.active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label="Preview" onClick={() => setPreviewing(t)}>
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit"
                        onClick={() => {
                          setEditing(t);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      {t.active ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Deactivate"
                          onClick={() => setDeactivating(t)}
                        >
                          <Power className="size-4 text-destructive" />
                        </Button>
                      ) : null}
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
            totalElements={query.data?.totalElements ?? rows.length}
            onChange={setPage}
          />
        </div>
      </QueryState>

      <TemplateFormDialog open={formOpen} onOpenChange={setFormOpen} template={editing} />
      <TemplatePreviewDialog template={previewing} onOpenChange={(o) => !o && setPreviewing(null)} />

      <ConfirmDialog
        open={Boolean(deactivating)}
        onOpenChange={(o) => !o && setDeactivating(undefined)}
        title="Deactivate template?"
        description={
          <>
            <span className="font-tabular font-medium">{deactivating?.code}</span> will be soft-deactivated
            and can no longer be used to send notifications.
          </>
        }
        confirmLabel="Deactivate"
        pending={deactivate.isPending}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}
