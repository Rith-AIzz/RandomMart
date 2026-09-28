import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(90),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const orderStatusSchema = z
  .object({
    status: z
      .enum([
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ])
      .optional(),
    cancellationReason: z.string().trim().min(3).max(500).optional(),
    refundedCents: z.number().int().nonnegative().optional(),
  })
  .refine(
    (value) => value.status !== undefined || value.refundedCents !== undefined,
    { message: "Provide a status or refund amount." },
  )
  .refine(
    (value) =>
      value.status !== "CANCELLED" || Boolean(value.cancellationReason),
    {
      message: "A cancellation reason is required.",
      path: ["cancellationReason"],
    },
  );

export const roleUpdateSchema = z.object({
  role: z.enum(["CUSTOMER", "SUPPORT", "MANAGER", "ADMIN"]),
});
