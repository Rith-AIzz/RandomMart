"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useStore } from "../../components/store-provider";
import { effectivePrice } from "../../lib/commerce";
import { formatMoney } from "../../lib/products";

export default function CartPage() {
  const { cart, totals, products, setQuantity, removeItem, clearCart } =
    useStore();
  const lines = cart.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product ? [{ ...line, product }] : [];
  });
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Home</Link>
            <span>Cart</span>
          </div>
          <h1>Your cart</h1>
          <p>
            {lines.length
              ? "Review your finds, adjust quantities, and continue to the secure simulated checkout."
              : "A few good finds would look lovely here."}
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          {!lines.length ? (
            <div className="empty-state">
              <ShoppingBag size={42} />
              <h2>Your cart is waiting</h2>
              <p>
                Browse the collection and add something that catches your eye.
              </p>
              <Link href="/products" className="button button-primary">
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="two-column">
              <div>
                <div className="cart-list">
                  {lines.map(({ product, quantity }) => (
                    <article className="cart-item" key={product.id}>
                      <Link
                        href={`/products/${product.slug}`}
                        className="cart-item-image"
                      >
                        <Image
                          src={product.image}
                          alt=""
                          style={{ objectPosition: product.imagePosition }}
                          fill
                          sizes="115px"
                        />
                      </Link>
                      <div>
                        <p className="eyebrow">{product.sku}</p>
                        <h2>
                          <Link href={`/products/${product.slug}`}>
                            {product.name}
                          </Link>
                        </h2>
                        <p>{formatMoney(effectivePrice(product))} each</p>
                        <div
                          className="quantity-control"
                          aria-label={`Quantity for ${product.name}`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(product.id, quantity - 1)
                            }
                            aria-label="Decrease quantity"
                          >
                            <Minus size={15} />
                          </button>
                          <span aria-live="polite">{quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(product.id, quantity + 1)
                            }
                            disabled={quantity >= product.stock}
                            aria-label="Increase quantity"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeItem(product.id)}
                        aria-label={`Remove ${product.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </article>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 20,
                  }}
                >
                  <Link href="/products" className="text-link">
                    <ArrowLeft size={16} /> Continue shopping
                  </Link>
                  <button
                    className="remove-button"
                    type="button"
                    onClick={clearCart}
                  >
                    Clear cart
                  </button>
                </div>
              </div>
              <aside className="summary-card">
                <h2>Order summary</h2>
                <div className="summary-lines">
                  <div>
                    <span>Products</span>
                    <span>{formatMoney(totals.subtotalCents)}</span>
                  </div>
                  <div className="discount">
                    <span>Discounts</span>
                    <span>−{formatMoney(totals.discountCents)}</span>
                  </div>
                  <div>
                    <span>Shipping</span>
                    <span>
                      {totals.shippingCents
                        ? formatMoney(totals.shippingCents)
                        : "Free"}
                    </span>
                  </div>
                  <div className="summary-total">
                    <span>Total</span>
                    <span>{formatMoney(totals.totalCents)}</span>
                  </div>
                </div>
                <Link href="/checkout" className="button button-light">
                  Continue to checkout
                </Link>
                <p className="summary-note">
                  This is a simulated checkout. RandomMart never asks for or
                  stores real card details.
                </p>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
