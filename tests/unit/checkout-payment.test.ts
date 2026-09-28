import { describe, expect, it } from "vitest";
import { checkoutSchema } from "../../schemas/checkout";
import { checkRateLimit } from "../../lib/rate-limit";
import { verifyStripeWebhookEvent } from "../../lib/stripe";

describe("Checkout, Payment & Security Infrastructure Tests", () => {
  describe("Checkout Payload Validation", () => {
    it("rejects invalid idempotency keys", () => {
      const result = checkoutSchema.safeParse({
        idempotencyKey: "invalid-uuid",
        paymentMethod: "TEST_CARD",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid checkout payloads with UUID and delivery address", () => {
      const result = checkoutSchema.safeParse({
        idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
        paymentMethod: "STRIPE",
        delivery: {
          name: "John Doe",
          line1: "123 Main St",
          city: "Metropolis",
          country: "United States",
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Rate Limiting Unit Verification", () => {
    it("permits requests up to max limit and blocks exceeding requests", () => {
      const testId = `test-user-${Date.now()}`;
      const config = { maxRequests: 2, windowSeconds: 60 };

      const res1 = checkRateLimit(testId, config);
      expect(res1.success).toBe(true);
      expect(res1.remaining).toBe(1);

      const res2 = checkRateLimit(testId, config);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(0);

      const res3 = checkRateLimit(testId, config);
      expect(res3.success).toBe(false);
      expect(res3.remaining).toBe(0);
    });
  });

  describe("Stripe Webhook Signature Verification", () => {
    it("fails closed when Stripe credentials or signature are unconfigured", () => {
      expect(() => verifyStripeWebhookEvent("raw-payload", null)).toThrow();
    });

    it("fails closed when Stripe webhook secret is unconfigured", () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      expect(() =>
        verifyStripeWebhookEvent("raw-payload", "t=123,v1=abc"),
      ).toThrow();
    });
  });
});
