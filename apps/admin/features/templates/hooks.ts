"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import type { PreviewRequest, TemplateListParams, TemplateRequest } from "@/core/api/types";
import {
  createTemplate,
  deactivateTemplate,
  listTemplates,
  previewTemplate,
  updateTemplate,
} from "@/features/templates/api";

export function useTemplateList(params: TemplateListParams) {
  return useQuery({
    queryKey: queryKeys.templates.list(params),
    queryFn: ({ signal }) => listTemplates(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TemplateRequest) => createTemplate(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: TemplateRequest }) => updateTemplate(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

export function useDeactivateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

export function usePreviewTemplate() {
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: PreviewRequest }) => previewTemplate(id, body),
  });
}
