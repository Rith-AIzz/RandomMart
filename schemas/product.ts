import { z } from "zod";
export const productSchema = z.object({
  name: z.string().trim().min(2).max(140),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
  sku: z.string().trim().min(3).max(60),
  shortDescription: z.string().trim().min(10).max(240),
  description: z.string().trim().min(20).max(10_000),
  priceCents: z.number().int().positive(),
  discountCents: z.number().int().nonnegative().optional(),
  stockQuantity: z.number().int().nonnegative(),
  categoryId: z.string().uuid(),
}).refine((value) => value.discountCents === undefined || value.discountCents < value.priceCents, { message: "Discount price must be lower than regular price.", path: ["discountCents"] });
