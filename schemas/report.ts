import { z } from "zod";

export const reportFiltersSchema = z.object({
  range: z.enum(["7", "30", "90", "custom"]),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  timezone: z.string().trim().min(1).max(80),
  metric: z.enum(["revenue", "orders"]),
});

export const savedReportSchema = z.object({
  name: z.string().trim().min(2).max(80),
  filters: reportFiltersSchema,
});
