import { ApplicationError, toErrorResponse } from "../../../../lib/application-error";
import { prisma } from "../../../../lib/prisma/client";
import { verifyStripeWebhookEvent } from "../../../../lib/stripe";
import type Stripe from "stripe";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    // Verify official Stripe signature
    const event = verifyStripeWebhookEvent(rawBody, signature);

    // Database-backed idempotency check using unique constraint on stripeEventId
    try {
      await prisma.stripeEvent.create({
        data: {
          stripeEventId: event.id,
          eventType: event.type,
          status: "PROCESSING",
        },
      });
    } catch {
      // Event already recorded & processed safely
      return Response.json({ received: true, duplicate: true }, { status: 200 });
    }

    // Process event types idempotently
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const stripeSessionId = session.id;
        const paymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : null;

        const order = await prisma.order.findFirst({
          where: {
            OR: [
              { stripeSessionId },
              ...(session.client_reference_id ? [{ id: session.client_reference_id }] : []),
            ],
          },
          include: { payments: true },
        });

        if (order && order.status !== "DELIVERED" && order.status !== "CANCELLED") {
          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: {
                status: "CONFIRMED",
                stripePaymentIntentId: paymentIntentId ?? order.stripePaymentIntentId,
              },
            }),
            prisma.paymentRecord.updateMany({
              where: { orderId: order.id },
              data: {
                status: "APPROVED",
                stripePaymentIntentId: paymentIntentId ?? undefined,
              },
            }),
          ]);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;

        const order = await prisma.order.findFirst({
          where: { stripePaymentIntentId: paymentIntentId },
        });

        if (order && order.status === "PENDING") {
          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: {
                status: "CANCELLED",
                cancellationReason: paymentIntent.last_payment_error?.message || "Payment failed",
              },
            }),
            prisma.paymentRecord.updateMany({
              where: { orderId: order.id },
              data: { status: "DECLINED" },
            }),
          ]);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string" ? charge.payment_intent : null;

        if (paymentIntentId) {
          const order = await prisma.order.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
          });

          if (order) {
            const amountRefunded = charge.amount_refunded;
            await prisma.$transaction([
              prisma.order.update({
                where: { id: order.id },
                data: {
                  refundedCents: amountRefunded,
                  status: amountRefunded >= order.totalCents ? "CANCELLED" : order.status,
                },
              }),
              prisma.paymentRecord.updateMany({
                where: { orderId: order.id },
                data: {
                  status: amountRefunded >= order.totalCents ? "REFUNDED" : "APPROVED",
                },
              }),
            ]);
          }
        }
        break;
      }
    }

    // Update StripeEvent record status to PROCESSED
    await prisma.stripeEvent.update({
      where: { stripeEventId: event.id },
      data: { status: "PROCESSED" },
    });

    return Response.json({ received: true }, { status: 200 });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}
