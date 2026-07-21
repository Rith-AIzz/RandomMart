import { PaymentMethod, PaymentStatus } from "../generated/prisma/enums";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma/client";
import { checkoutSchema } from "../schemas/checkout";

export async function createOrderForUser(profileId: string, untrustedInput: unknown) {
  const input = checkoutSchema.parse(untrustedInput);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { items: true } });
    if (existing) {
      if (existing.profileId !== profileId) throw new Error("ACCESS_DENIED");
      return existing;
    }
    const [cart, address] = await Promise.all([
      tx.cart.findFirst({ where: { profileId, isActive: true }, include: { items: { include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } } } } }),
      tx.address.findFirst({ where: { id: input.addressId, profileId } }),
    ]);
    if (!cart?.items.length) throw new Error("CART_EMPTY");
    if (!address) throw new Error("ADDRESS_NOT_FOUND");
    for (const item of cart.items) {
      if (!item.product.isActive || item.quantity < 1) throw new Error("PRODUCT_UNAVAILABLE");
      const updated = await tx.product.updateMany({ where: { id: item.productId, isActive: true, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } });
      if (updated.count !== 1) throw new Error("INSUFFICIENT_INVENTORY");
    }
    const subtotalCents = cart.items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
    const saleSubtotalCents = cart.items.reduce((sum, item) => sum + (item.product.discountCents ?? item.product.priceCents) * item.quantity, 0);
    const totals = { subtotalCents, discountCents: subtotalCents - saleSubtotalCents, shippingCents: saleSubtotalCents >= 7500 ? 0 : 800, totalCents: saleSubtotalCents + (saleSubtotalCents >= 7500 ? 0 : 800) };
    const orderNumber = `RM-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
    const order = await tx.order.create({ data: {
      profileId, orderNumber, idempotencyKey: input.idempotencyKey, status: "CONFIRMED",
      subtotalCents: totals.subtotalCents, discountCents: totals.discountCents, shippingCents: totals.shippingCents, totalCents: totals.totalCents,
      shippingName: address.recipient, shippingAddress: { line1: address.line1, line2: address.line2, city: address.city, region: address.region, postalCode: address.postalCode, country: address.country },
      items: { create: cart.items.map((item) => ({ productId: item.productId, productName: item.product.name, productSku: item.product.sku, productImage: item.product.images[0]?.path, unitPriceCents: item.product.discountCents ?? item.product.priceCents, quantity: item.quantity, lineTotalCents: (item.product.discountCents ?? item.product.priceCents) * item.quantity })) },
      payments: { create: { method: input.paymentMethod as PaymentMethod, status: input.demoOutcome === "DECLINED" ? PaymentStatus.DECLINED : PaymentStatus.APPROVED, amountCents: totals.totalCents, demoReference: `DEMO-${input.idempotencyKey.slice(0, 8)}` } },
    }, include: { items: true, payments: true } });
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return order;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
