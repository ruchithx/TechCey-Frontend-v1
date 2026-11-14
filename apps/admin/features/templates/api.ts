import { request } from "@/core/api/http";
import { ENDPOINTS } from "@/core/api/endpoints";
import { normalisePage, type Page } from "@/core/api/page";
import type {
  PreviewRequest,
  PreviewResponse,
  TemplateListParams,
  TemplateRequest,
  TemplateResponse,
} from "@/core/api/types";

/** notification-service SLIM envelope; list is a Spring `Page`. */

export async function listTemplates(
  params: TemplateListParams,
  signal?: AbortSignal,
): Promise<Page<TemplateResponse>> {
  const raw = await request<unknown>(ENDPOINTS.templates.list(), { params, signal });
  return normalisePage<TemplateResponse>(raw);
}

export function getTemplate(id: number, signal?: AbortSignal): Promise<TemplateResponse> {
  return request<TemplateResponse>(ENDPOINTS.templates.byId(id), { signal });
}

export function createTemplate(body: TemplateRequest): Promise<TemplateResponse> {
  return request<TemplateResponse>(ENDPOINTS.templates.create(), { method: "POST", body });
}

export function updateTemplate(id: number, body: TemplateRequest): Promise<TemplateResponse> {
  return request<TemplateResponse>(ENDPOINTS.templates.update(id), { method: "PUT", body });
}

export function deactivateTemplate(id: number): Promise<void> {
  return request<void>(ENDPOINTS.templates.remove(id), { method: "DELETE" });
}

export function previewTemplate(id: number, body: PreviewRequest): Promise<PreviewResponse> {
  return request<PreviewResponse>(ENDPOINTS.templates.preview(id), { method: "POST", body });
}
