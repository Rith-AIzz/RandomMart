import Stripe from "stripe";
import { ApplicationError } from "./application-error";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-01-28" as Stripe.LatestApiVersion,
    })
  : null;

export function getStripeClient(): Stripe {
  if (!stripe) {
    throw new ApplicationError(
      "STRIPE_NOT_CONFIGURED",
      503,
      "Stripe payment provider is not configured in this environment.",
    );
  }
  return stripe;
}

export function verifyStripeWebhookEvent(
  rawBody: string | Buffer,
  signature: string | null,
): Stripe.Event {
  const client = getStripeClient();
  if (!stripeWebhookSecret) {
    throw new ApplicationError(
      "WEBHOOK_SECRET_MISSING",
      500,
      "Stripe webhook secret is not configured.",
    );
  }
  if (!signature) {
    throw new ApplicationError(
      "MISSING_STRIPE_SIGNATURE",
      400,
      "Stripe-Signature header is missing.",
    );
  }

  try {
    return client.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid webhook signature";
    throw new ApplicationError("INVALID_WEBHOOK_SIGNATURE", 400, message);
  }
}

export async function createStripeRefund(params: {
  paymentIntentId: string;
  amountCents: number;
  reason?: Stripe.RefundCreateParams.Reason;
}) {
  const client = getStripeClient();
  try {
    return await client.refunds.create({
      payment_intent: params.paymentIntentId,
      amount: params.amountCents,
      reason: params.reason,
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Failed to process Stripe refund.";
    throw new ApplicationError("REFUND_FAILED", 502, message);
  }
}
