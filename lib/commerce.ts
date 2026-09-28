import type { Product } from "./products";

export type CartLine = { productId: string; quantity: number };

export type Totals = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
};

export function effectivePrice(product: Product) {
  return product.discountCents ?? product.priceCents;
}

export function validateQuantity(quantity: number, stock: number) {
  if (!Number.isInteger(quantity)) return "Quantity must be a whole number.";
  if (quantity < 1) return "Quantity must be at least one.";
  if (quantity > stock)
    return `Only ${stock} item${stock === 1 ? "" : "s"} available.`;
  return null;
}

export function calculateTotals(
  lines: Array<CartLine & { product: Product }>,
): Totals {
  const subtotalCents = lines.reduce(
    (total, line) => total + line.product.priceCents * line.quantity,
    0,
  );
  const saleSubtotalCents = lines.reduce(
    (total, line) => total + effectivePrice(line.product) * line.quantity,
    0,
  );
  const discountCents = subtotalCents - saleSubtotalCents;
  const shippingCents =
    saleSubtotalCents === 0 || saleSubtotalCents >= 7500 ? 0 : 800;
  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: saleSubtotalCents + shippingCents,
  };
}

const allowedTransitions: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransitionOrder(from: string, to: string) {
  return allowedTransitions[from]?.includes(to) ?? false;
}

export function mergeGuestCart(
  guest: CartLine[],
  saved: CartLine[],
  inventory: Record<string, number>,
) {
  const merged = new Map<string, number>();
  for (const line of [...saved, ...guest]) {
    const available = Math.max(0, inventory[line.productId] ?? 0);
    merged.set(
      line.productId,
      Math.min(available, (merged.get(line.productId) ?? 0) + line.quantity),
    );
  }
  return [...merged]
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));
}
