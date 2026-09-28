import { z } from "zod";
export const checkoutSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    addressId: z.string().uuid().optional(),
    delivery: z
      .object({
        name: z.string().trim().min(2).max(120),
        line1: z.string().trim().min(3).max(180),
        line2: z.string().trim().max(180).optional(),
        city: z.string().trim().min(2).max(100),
        region: z.string().trim().max(100).optional(),
        postalCode: z.string().trim().max(30).optional(),
        country: z.string().trim().min(2).max(100),
      })
      .optional(),
    paymentMethod: z.enum(["CASH_ON_DELIVERY", "TEST_CARD", "STRIPE"]),
    simulatedOutcome: z.enum(["APPROVED", "DECLINED"]).optional(),
  })
  .refine((value) => Boolean(value.addressId || value.delivery), {
    message: "Choose a saved address or provide delivery details.",
    path: ["delivery"],
  });

export const orderRequestSchema = checkoutSchema;
