import { z } from "zod";

export const addressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(50),
  recipient: z.string().trim().min(2).max(120),
  line1: z.string().trim().min(3).max(180),
  line2: z.string().trim().max(180).optional(),
  city: z.string().trim().min(2).max(100),
  region: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(30).optional(),
  country: z.string().trim().min(2).max(100),
  isDefault: z.boolean().optional(),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional(),
  address: addressSchema.optional(),
});
