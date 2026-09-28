import { ApplicationError } from "../lib/application-error";
import { prisma } from "../lib/prisma/client";
import type { CartLine } from "../lib/commerce";

async function activeCart(profileId: string) {
  const existing = await prisma.cart.findFirst({
    where: { profileId, isActive: true },
  });
  return existing ?? prisma.cart.create({ data: { profileId } });
}

export async function getCartForUser(profileId: string) {
  const cart = await activeCart(profileId);
  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    orderBy: { createdAt: "asc" },
  });
  return items.map(({ productId, quantity }) => ({ productId, quantity }));
}

export async function setCartLineForUser(
  profileId: string,
  productId: string,
  quantity: number,
) {
  const cart = await activeCart(profileId);
  if (quantity === 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    return getCartForUser(profileId);
  }
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    select: { stockQuantity: true },
  });
  if (!product)
    throw new ApplicationError(
      "PRODUCT_UNAVAILABLE",
      404,
      "This product is unavailable.",
    );
  if (quantity > product.stockQuantity)
    throw new ApplicationError(
      "INSUFFICIENT_INVENTORY",
      409,
      `Only ${product.stockQuantity} items are available.`,
    );
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity },
    create: { cartId: cart.id, productId, quantity },
  });
  return getCartForUser(profileId);
}

export async function mergeCartForUser(profileId: string, lines: CartLine[]) {
  for (const line of lines) {
    const current = await getCartForUser(profileId);
    const saved =
      current.find((item) => item.productId === line.productId)?.quantity ?? 0;
    const product = await prisma.product.findFirst({
      where: { id: line.productId, isActive: true },
      select: { stockQuantity: true },
    });
    if (!product?.stockQuantity) continue;
    await setCartLineForUser(
      profileId,
      line.productId,
      Math.min(product.stockQuantity, saved + line.quantity),
    );
  }
  return getCartForUser(profileId);
}
