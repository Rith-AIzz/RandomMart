import { PaymentMethod, PaymentStatus } from "../generated/prisma/enums";
import { Prisma } from "../generated/prisma/client";
import { ApplicationError } from "../lib/application-error";
import { prisma } from "../lib/prisma/client";
import { checkoutSchema } from "../schemas/checkout";
import { sendOrderConfirmationEmail, sendRefundConfirmationEmail } from "./email.service";
import { createStripeRefund } from "../lib/stripe";

const retryableTransaction = (cause: unknown) =>
  cause instanceof Prisma.PrismaClientKnownRequestError &&
  cause.code === "P2034";

export async function createOrderForUser(
  profileId: string | null,
  untrustedInput: unknown,
  guestEmail?: string,
) {
  const input = checkoutSchema.parse(untrustedInput);

  if (
    input.paymentMethod === "TEST_CARD" &&
    input.simulatedOutcome === "DECLINED"
  ) {
    throw new ApplicationError(
      "PAYMENT_DECLINED",
      402,
      "The simulated payment was declined. Your cart was not changed.",
    );
  }

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const order = await prisma.$transaction(
        async (tx) => {
          const existing = await tx.order.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
            include: { items: true, payments: true },
          });
          if (existing) {
            if (profileId && existing.profileId !== profileId) {
              throw new ApplicationError("ACCESS_DENIED", 403);
            }
            return existing;
          }

          let cartItems: Array<{
            productId: string;
            quantity: number;
            product: {
              id: string;
              name: string;
              sku: string;
              priceCents: number;
              costCents: number;
              discountCents: number | null;
              stockQuantity: number;
              isActive: boolean;
              images: Array<{ path: string }>;
            };
          }> = [];
          let cartIdToDelete: string | null = null;

          if (profileId) {
            const cart = await tx.cart.findFirst({
              where: { profileId, isActive: true },
              include: {
                items: {
                  include: {
                    product: {
                      include: {
                        images: { orderBy: { sortOrder: "asc" }, take: 1 },
                      },
                    },
                  },
                },
              },
            });
            if (cart?.items.length) {
              cartItems = cart.items;
              cartIdToDelete = cart.id;
            }
          }

          if (!cartItems.length) {
            throw new ApplicationError(
              "CART_EMPTY",
              409,
              "Your cart is empty.",
            );
          }

          const savedAddress = (input.addressId && profileId)
            ? await tx.address.findFirst({
                where: { id: input.addressId, profileId },
              })
            : null;

          if (input.addressId && profileId && !savedAddress) {
            throw new ApplicationError(
              "ADDRESS_NOT_FOUND",
              404,
              "The delivery address was not found.",
            );
          }

          const address =
            savedAddress ??
            (input.delivery
              ? {
                  recipient: input.delivery.name,
                  line1: input.delivery.line1,
                  line2: input.delivery.line2 ?? null,
                  city: input.delivery.city,
                  region: input.delivery.region ?? null,
                  postalCode: input.delivery.postalCode ?? null,
                  country: input.delivery.country,
                }
              : null);

          if (!address) {
            throw new ApplicationError(
              "ADDRESS_NOT_FOUND",
              404,
              "The delivery address was not found.",
            );
          }

          // Atomic inventory reservation and stock validation
          for (const item of cartItems) {
            if (!item.product.isActive || item.quantity < 1) {
              throw new ApplicationError("PRODUCT_UNAVAILABLE", 409);
            }
            const updated = await tx.product.updateMany({
              where: {
                id: item.productId,
                isActive: true,
                stockQuantity: { gte: item.quantity },
              },
              data: { stockQuantity: { decrement: item.quantity } },
            });
            if (updated.count !== 1) {
              throw new ApplicationError(
                "INSUFFICIENT_INVENTORY",
                409,
                `Not enough stock is available for ${item.product.name}.`,
              );
            }
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                quantityDelta: -item.quantity,
                reason: "ORDER_PLACED",
                reference: input.idempotencyKey,
              },
            });
          }

          const subtotalCents = cartItems.reduce(
            (sum, item) => sum + item.product.priceCents * item.quantity,
            0,
          );
          const saleSubtotalCents = cartItems.reduce(
            (sum, item) =>
              sum +
              (item.product.discountCents ?? item.product.priceCents) *
                item.quantity,
            0,
          );
          const shippingCents = saleSubtotalCents >= 7500 ? 0 : 800;

          const guestAccessToken = !profileId ? crypto.randomUUID().replaceAll("-", "") : null;

          const order = await tx.order.create({
            data: {
              profileId: profileId ?? undefined,
              guestEmail: guestEmail ?? undefined,
              guestAccessToken: guestAccessToken ?? undefined,
              orderNumber: `RM-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`,
              idempotencyKey: input.idempotencyKey,
              status: (input.paymentMethod as string) === "STRIPE" ? "PENDING" : "CONFIRMED",
              subtotalCents,
              discountCents: subtotalCents - saleSubtotalCents,
              shippingCents,
              totalCents: saleSubtotalCents + shippingCents,
              shippingName: address.recipient,
              shippingAddress: {
                line1: address.line1,
                line2: address.line2,
                city: address.city,
                region: address.region,
                postalCode: address.postalCode,
                country: address.country,
              },
              items: {
                create: cartItems.map((item) => ({
                  productId: item.productId,
                  productName: item.product.name,
                  productSku: item.product.sku,
                  productImage: item.product.images[0]?.path,
                  unitPriceCents:
                    item.product.discountCents ?? item.product.priceCents,
                  unitCostCents: item.product.costCents,
                  quantity: item.quantity,
                  lineTotalCents:
                    (item.product.discountCents ?? item.product.priceCents) *
                    item.quantity,
                  lineCostCents: item.product.costCents * item.quantity,
                })),
              },
              payments: {
                create: {
                  method: input.paymentMethod as PaymentMethod,
                  status:
                    input.paymentMethod === "CASH_ON_DELIVERY" || (input.paymentMethod as string) === "STRIPE"
                      ? PaymentStatus.PENDING
                      : PaymentStatus.APPROVED,
                  amountCents: saleSubtotalCents + shippingCents,
                  testReference:
                    input.paymentMethod === "TEST_CARD"
                      ? `TEST-${input.idempotencyKey.slice(0, 8)}`
                      : null,
                },
              },
            },
            include: { items: true, payments: true },
          });

          if (cartIdToDelete) {
            await tx.cartItem.deleteMany({ where: { cartId: cartIdToDelete } });
          }
          return order;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      // Trigger non-blocking transactional email notification
      const recipientEmail = guestEmail || (profileId ? (await prisma.profile.findUnique({ where: { id: profileId } }))?.email : null);
      if (recipientEmail) {
        sendOrderConfirmationEmail({
          toEmail: recipientEmail,
          customerName: order.shippingName,
          orderNumber: order.orderNumber,
          totalFormatted: `$${(order.totalCents / 100).toFixed(2)}`,
          items: order.items.map((i) => ({
            name: i.productName,
            quantity: i.quantity,
            priceFormatted: `$${(i.lineTotalCents / 100).toFixed(2)}`,
          })),
        }).catch((err) => console.error("Email trigger failed asynchronously:", err));
      }

      return order;
    } catch (cause) {
      if (attempt < 3 && retryableTransaction(cause)) continue;
      throw cause;
    }
  }
  throw new ApplicationError(
    "ORDER_RETRY_EXHAUSTED",
    503,
    "Checkout is busy. Please try again.",
  );
}

export async function processOrderRefund(params: {
  orderId: string;
  amountCents: number;
  reason?: string;
  actorId: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { payments: true },
  });

  if (!order) {
    throw new ApplicationError("ORDER_NOT_FOUND", 404, "Order not found.");
  }

  const remainingRefundable = order.totalCents - order.refundedCents;
  if (params.amountCents <= 0 || params.amountCents > remainingRefundable) {
    throw new ApplicationError(
      "INVALID_REFUND_AMOUNT",
      400,
      `Refund amount must be between $0.01 and $${(remainingRefundable / 100).toFixed(2)}.`,
    );
  }

  // If order was paid via Stripe, execute official Stripe server refund
  if (order.stripePaymentIntentId) {
    await createStripeRefund({
      paymentIntentId: order.stripePaymentIntentId,
      amountCents: params.amountCents,
    });
  }

  const newRefundTotal = order.refundedCents + params.amountCents;
  const isFullRefund = newRefundTotal >= order.totalCents;

  const updatedOrder = await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        refundedCents: newRefundTotal,
        status: isFullRefund ? "CANCELLED" : order.status,
      },
    }),
    prisma.paymentRecord.updateMany({
      where: { orderId: order.id },
      data: {
        status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.APPROVED,
      },
    }),
  ]);

  // Non-blocking refund confirmation email
  const recipientEmail = order.guestEmail || (order.profileId ? (await prisma.profile.findUnique({ where: { id: order.profileId } }))?.email : null);
  if (recipientEmail) {
    sendRefundConfirmationEmail({
      toEmail: recipientEmail,
      customerName: order.shippingName,
      orderNumber: order.orderNumber,
      totalFormatted: `$${(params.amountCents / 100).toFixed(2)}`,
      items: [],
    }).catch((err) => console.error("Refund email error:", err));
  }

  return updatedOrder[0];
}
