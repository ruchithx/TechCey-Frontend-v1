import { z } from "zod";
import type { TemplateRequest } from "@/core/api/types";

/** Mirrors TemplateRequest (ADMIN_API.md §7). requiredVars is entered comma-separated. */
export const templateSchema = z.object({
  code: z.string().trim().min(1, "Code is required").max(50, "Max 50 characters"),
  channel: z.enum(["EMAIL", "SMS", "IN_APP", "PUSH"]),
  locale: z.string().trim().max(10, "Max 10 characters").optional(),
  subjectTemplate: z.string().trim().max(255, "Max 255 characters").optional(),
  bodyTemplate: z.string().trim().min(1, "Body is required"),
  contentType: z.enum(["TEXT", "HTML"]),
  requiredVars: z.string().trim().optional(),
  description: z.string().trim().max(255, "Max 255 characters").optional(),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;

export function toTemplateRequest(values: TemplateFormValues): TemplateRequest {
  const vars = (values.requiredVars ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return {
    code: values.code.trim(),
    channel: values.channel,
    locale: values.locale?.trim() || undefined,
    subjectTemplate: values.subjectTemplate?.trim() ? values.subjectTemplate.trim() : null,
    bodyTemplate: values.bodyTemplate,
    contentType: values.contentType,
    requiredVars: vars.length ? vars : undefined,
    description: values.description?.trim() ? values.description.trim() : null,
  };
}
