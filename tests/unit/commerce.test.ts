import { describe, expect, it } from "vitest";
import {
  calculateTotals,
  canTransitionOrder,
  mergeGuestCart,
  validateQuantity,
} from "../../lib/commerce";
import { products } from "../../lib/products";
import { cartLineSchema, mergeCartSchema } from "../../schemas/cart";
import { checkoutSchema, orderRequestSchema } from "../../schemas/checkout";
import { productSchema } from "../../schemas/product";
import { hasPermission } from "../../lib/permissions";
import { reviewCreateSchema } from "../../schemas/review";
import { wishlistItemSchema } from "../../schemas/wishlist";
import { getCatalogPage } from "../../lib/catalog";

describe("commerce rules", () => {
  it("calculates integer-cents totals, discounts, and shipping", () => {
    const product = products[0];
    const totals = calculateTotals([
      { productId: product.id, quantity: 1, product },
    ]);
    expect(totals.subtotalCents).toBe(12900);
    expect(totals.discountCents).toBe(3000);
    expect(totals.shippingCents).toBe(0);
    expect(totals.totalCents).toBe(9900);
  });
  it("rejects zero, decimal, and over-stock quantities", () => {
    expect(validateQuantity(0, 4)).toMatch(/at least/);
    expect(validateQuantity(1.5, 4)).toMatch(/whole/);
    expect(validateQuantity(5, 4)).toMatch(/Only/);
  });
  it("caps merged guest carts at available inventory", () => {
    expect(
      mergeGuestCart(
        [{ productId: "p", quantity: 4 }],
        [{ productId: "p", quantity: 3 }],
        { p: 5 },
      ),
    ).toEqual([{ productId: "p", quantity: 5 }]);
  });
  it("enforces valid order status transitions", () => {
    expect(canTransitionOrder("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransitionOrder("DELIVERED", "PROCESSING")).toBe(false);
  });
  it("rejects unknown status transitions", () => {
    expect(canTransitionOrder("UNKNOWN", "SHIPPED")).toBe(false);
    expect(canTransitionOrder("CANCELLED", "CONFIRMED")).toBe(false);
  });
  it("does not create negative totals for an empty cart", () => {
    expect(calculateTotals([])).toEqual({
      subtotalCents: 0,
      discountCents: 0,
      shippingCents: 0,
      totalCents: 0,
    });
  });
  it("drops unavailable items while merging carts", () => {
    expect(
      mergeGuestCart([{ productId: "gone", quantity: 2 }], [], { gone: 0 }),
    ).toEqual([]);
  });
});

describe("request validation", () => {
  it("accepts a valid checkout and rejects invalid identifiers", () => {
    const valid = {
      idempotencyKey: crypto.randomUUID(),
      addressId: crypto.randomUUID(),
      paymentMethod: "TEST_CARD" as const,
      simulatedOutcome: "APPROVED" as const,
    };
    expect(checkoutSchema.parse(valid)).toEqual(valid);
    expect(() =>
      checkoutSchema.parse({ ...valid, addressId: "not-an-id" }),
    ).toThrow();
  });
  it("validates complete delivery details", () => {
    expect(
      orderRequestSchema.safeParse({
        idempotencyKey: crypto.randomUUID(),
        paymentMethod: "CASH_ON_DELIVERY",
        delivery: {
          name: "Maya Chen",
          line1: "12 Riverside Road",
          city: "Phnom Penh",
          country: "Cambodia",
        },
      }).success,
    ).toBe(true);
    expect(
      orderRequestSchema.safeParse({
        idempotencyKey: crypto.randomUUID(),
        paymentMethod: "CASH_ON_DELIVERY",
        delivery: { name: "", line1: "", city: "", country: "" },
      }).success,
    ).toBe(false);
  });
  it("accepts one-time delivery without creating a saved address", () => {
    expect(
      checkoutSchema.safeParse({
        idempotencyKey: crypto.randomUUID(),
        paymentMethod: "CASH_ON_DELIVERY",
        delivery: {
          name: "Maya Chen",
          line1: "12 Riverside Road",
          city: "Phnom Penh",
          country: "Cambodia",
        },
      }).success,
    ).toBe(true);
  });
  it("validates wishlist and review input", () => {
    expect(
      wishlistItemSchema.safeParse({ productId: crypto.randomUUID() }).success,
    ).toBe(true);
    expect(
      reviewCreateSchema.safeParse({
        productId: crypto.randomUUID(),
        rating: 5,
        title: "Excellent",
        body: "A genuinely useful product.",
      }).success,
    ).toBe(true);
    expect(
      reviewCreateSchema.safeParse({
        productId: crypto.randomUUID(),
        rating: 6,
        body: "Too high a rating.",
      }).success,
    ).toBe(false);
  });
  it("rejects unsafe cart quantities", () => {
    expect(
      cartLineSchema.safeParse({ productId: crypto.randomUUID(), quantity: -1 })
        .success,
    ).toBe(false);
    expect(
      mergeCartSchema.safeParse({
        lines: Array.from({ length: 101 }, () => ({
          productId: crypto.randomUUID(),
          quantity: 1,
        })),
      }).success,
    ).toBe(false);
  });
  it("rejects discounts that are not lower than the price", () => {
    const value = {
      name: "Useful product",
      slug: "useful-product",
      sku: "SKU-123",
      shortDescription: "A sufficiently useful description",
      description: "A sufficiently detailed product description.",
      priceCents: 1000,
      discountCents: 1000,
      stockQuantity: 1,
      categoryId: crypto.randomUUID(),
    };
    expect(productSchema.safeParse(value).success).toBe(false);
  });
});

describe("catalog pagination", () => {
  it("returns bounded preview pages and preserves filtering", async () => {
    const page = await getCatalogPage(
      { category: "electronics", page: "1" },
      2,
    );
    expect(page.products).toHaveLength(2);
    expect(
      page.products.every((product) => product.category === "electronics"),
    ).toBe(true);
    expect(page.total).toBeGreaterThanOrEqual(3);
    expect(page.pageCount).toBeGreaterThan(1);
  });
});

describe("role permissions", () => {
  it("keeps customers out of staff tools", () => {
    expect(hasPermission("CUSTOMER", "admin.access")).toBe(false);
  });
  it("limits support to orders and customer assistance", () => {
    expect(hasPermission("SUPPORT", "orders.manage")).toBe(true);
    expect(hasPermission("SUPPORT", "customers.read")).toBe(true);
    expect(hasPermission("SUPPORT", "catalog.manage")).toBe(false);
    expect(hasPermission("SUPPORT", "roles.manage")).toBe(false);
  });
  it("lets managers operate commerce without changing roles", () => {
    expect(hasPermission("MANAGER", "catalog.manage")).toBe(true);
    expect(hasPermission("MANAGER", "orders.manage")).toBe(true);
    expect(hasPermission("MANAGER", "audit.read")).toBe(false);
  });
  it("reserves role and audit control for administrators", () => {
    expect(hasPermission("ADMIN", "roles.manage")).toBe(true);
    expect(hasPermission("ADMIN", "audit.read")).toBe(true);
  });
});
