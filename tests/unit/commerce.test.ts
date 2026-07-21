import { describe, expect, it } from "vitest";
import { calculateTotals, canTransitionOrder, mergeGuestCart, validateQuantity } from "../../lib/commerce";
import { products } from "../../lib/products";

describe("commerce rules", () => {
  it("calculates integer-cents totals, discounts, and shipping", () => { const product = products[0]; const totals = calculateTotals([{ productId: product.id, quantity: 1, product }]); expect(totals.subtotalCents).toBe(12900); expect(totals.discountCents).toBe(3000); expect(totals.shippingCents).toBe(0); expect(totals.totalCents).toBe(9900); });
  it("rejects zero, decimal, and over-stock quantities", () => { expect(validateQuantity(0, 4)).toMatch(/at least/); expect(validateQuantity(1.5, 4)).toMatch(/whole/); expect(validateQuantity(5, 4)).toMatch(/Only/); });
  it("caps merged guest carts at available inventory", () => { expect(mergeGuestCart([{productId:"p",quantity:4}],[{productId:"p",quantity:3}],{p:5})).toEqual([{productId:"p",quantity:5}]); });
  it("enforces valid order status transitions", () => { expect(canTransitionOrder("PENDING","CONFIRMED")).toBe(true); expect(canTransitionOrder("DELIVERED","PROCESSING")).toBe(false); });
});
