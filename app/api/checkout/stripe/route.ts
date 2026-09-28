import { assertSameOrigin, toErrorResponse } from "../../../../lib/application-error";
import { enforceRateLimit, PRESET_RATE_LIMITS } from "../../../../lib/rate-limit";
import { getStripeClient } from "../../../../lib/stripe";
import { checkoutSchema } from "../../../../schemas/checkout";
import { createOrderForUser } from "../../../../services/order.service";
import { createClient } from "../../../../lib/supabase/server";
import { prisma } from "../../../../lib/prisma/client";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request, true);
    enforceRateLimit(request, "stripe-checkout", PRESET_RATE_LIMITS.AUTH);

    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id ?? null;

    const payload = (await request.json()) as Record<string, unknown>;
    const guestEmail = !userId && payload && "guestEmail" in payload && payload.guestEmail ? String(payload.guestEmail) : undefined;

    // Server-authoritative order creation inside serializable transaction
    const order = await createOrderForUser(userId, payload, guestEmail);

    const stripe = getStripeClient();
    const origin = new URL(request.url).origin;

    // Create official Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: order.items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.productName,
            images: item.productImage ? [new URL(item.productImage, origin).href] : [],
          },
          unit_amount: item.unitPriceCents,
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${origin}/orders?id=${order.id}&status=success`,
      cancel_url: `${origin}/cart?canceled=1`,
      client_reference_id: order.id,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    // Update order with Stripe Session ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return Response.json({ url: session.url, session: session.id, orderId: order.id });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}
