import { z } from "zod";
export const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  addressId: z.string().uuid(),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "DEMO_CARD"]),
  demoOutcome: z.enum(["APPROVED", "DECLINED"]).optional(),
});
