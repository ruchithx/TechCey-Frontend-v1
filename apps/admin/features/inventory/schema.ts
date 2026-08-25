import { z } from "zod";

const intString = (msg: string) => z.string().trim().regex(/^\d+$/, msg);

/** POST /api/v1/inventory (ADMIN_API.md §4). */
export const createInventorySchema = z.object({
  productId: z.string().trim().regex(/^\d+$/, "Numeric product id required"),
  sku: z.string().trim().min(1, "SKU is required").max(100, "Max 100 characters"),
  quantityOnHand: intString("Whole numbers only"),
  reorderLevel: intString("Whole numbers only").or(z.literal("")),
  warehouseCode: z.string().trim().max(20, "Max 20 characters").optional(),
});
export type CreateInventoryValues = z.infer<typeof createInventorySchema>;

/** PUT /api/v1/inventory/{productId} — absolute stock take. */
export const setStockSchema = z.object({
  quantityOnHand: intString("Whole numbers only"),
  note: z.string().trim().max(500, "Max 500 characters").optional(),
});
export type SetStockValues = z.infer<typeof setStockSchema>;

/** PATCH /api/v1/inventory/{productId}/adjust — relative delta. */
export const adjustSchema = z.object({
  delta: z
    .string()
    .trim()
    .regex(/^-?\d+$/, "Enter a signed whole number")
    .refine((v) => Number(v) !== 0, "Delta cannot be zero"),
  reason: z.enum(["INBOUND", "DAMAGED", "LOST", "RETURNED", "CORRECTION", "MANUAL"]),
  note: z.string().trim().max(500, "Max 500 characters").optional(),
});
export type AdjustValues = z.infer<typeof adjustSchema>;

/** PATCH /api/v1/inventory/{productId}/reorder-level. */
export const reorderSchema = z.object({
  reorderLevel: intString("Whole numbers only"),
});
export type ReorderValues = z.infer<typeof reorderSchema>;
