import { z } from "zod";

export const cartLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(0).max(99),
});

export const mergeCartSchema = z.object({
  lines: z
    .array(cartLineSchema.extend({ quantity: z.number().int().min(1).max(99) }))
    .max(100),
});
