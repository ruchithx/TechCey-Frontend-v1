import { z } from "zod";

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Mirrors SendNotificationRequest (ADMIN_API.md §6). `variables` is entered as a
 * JSON object in a textarea and validated to parse into a flat string map.
 */
export const sendNotificationSchema = z
  .object({
    channel: z.enum(["EMAIL", "SMS", "IN_APP", "PUSH"]),
    templateCode: z.string().trim().min(1, "Template code is required"),
    userId: z
      .string()
      .trim()
      .refine((v) => v === "" || UUID_RE.test(v), "Enter a valid UUID")
      .optional(),
    recipient: z.string().trim().optional(),
    locale: z.string().trim().max(10).optional(),
    priority: z
      .string()
      .trim()
      .refine((v) => v === "" || /^[1-9]$/.test(v), "1–9")
      .optional(),
    referenceType: z.string().trim().optional(),
    referenceId: z.string().trim().optional(),
    variablesJson: z
      .string()
      .trim()
      .refine((v) => {
        if (v === "") return true;
        try {
          const parsed = JSON.parse(v);
          return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
        } catch {
          return false;
        }
      }, "Must be a JSON object, e.g. {\"orderId\":\"123\"}")
      .optional(),
  })
  .refine((v) => Boolean(v.userId?.trim()) || Boolean(v.recipient?.trim()), {
    message: "Provide a user ID or a recipient",
    path: ["recipient"],
  });

export type SendNotificationValues = z.infer<typeof sendNotificationSchema>;

export function parseVariables(json: string | undefined): Record<string, string> | undefined {
  if (!json || json.trim() === "") return undefined;
  const parsed = JSON.parse(json) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(parsed)) out[k] = String(val);
  return out;
}
