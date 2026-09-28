"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  PackageCheck,
  Truck,
} from "lucide-react";
import { useStore } from "../../components/store-provider";
import { formatMoney, productById } from "../../lib/products";

export default function CheckoutPage() {
  const { cart, totals, user, placeOrder } = useStore();
  const [completed, setCompleted] = useState<{
    number: string;
    total: number;
  } | null>(null);
  const [payment, setPayment] = useState("cod");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError("");
    try {
      const order = await placeOrder(
        {
          name: String(form.get("name")),
          line1: String(form.get("address")),
          city: String(form.get("city")),
          country: String(form.get("country")),
        },
        payment === "cod" ? "CASH_ON_DELIVERY" : "TEST_CARD",
      );
      setCompleted({ number: order.number, total: order.totalCents });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Checkout failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (completed)
    return (
      <main>
        <section className="auth-shell">
          <div className="auth-card" style={{ textAlign: "center" }}>
            <CheckCircle2
              size={55}
              color="#f25a19"
              style={{ margin: "0 auto" }}
            />
            <p className="eyebrow">Order confirmed</p>
            <h1>Thank you!</h1>
            <p>
              Your simulated order <strong>{completed.number}</strong> has been
              created for {formatMoney(completed.total)}. No real payment was
              processed.
            </p>
            <div style={{ display: "grid", gap: 10, marginTop: 24 }}>
              <Link href="/orders" className="button button-primary">
                View order history
              </Link>
              <Link href="/products" className="button button-outline">
                Keep shopping
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  if (!cart.length)
    return (
      <main>
        <section className="auth-shell">
          <div className="auth-card" style={{ textAlign: "center" }}>
            <PackageCheck
              size={50}
              color="#f25a19"
              style={{ margin: "0 auto" }}
            />
            <h1>Your cart is empty</h1>
            <p>Add at least one product before opening checkout.</p>
            <Link href="/products" className="button button-primary">
              Browse products
            </Link>
          </div>
        </section>
      </main>
    );
  if (!user)
    return (
      <main>
        <section className="auth-shell">
          <div className="auth-card" style={{ textAlign: "center" }}>
            <LockKeyhole
              size={50}
              color="#f25a19"
              style={{ margin: "0 auto" }}
            />
            <p className="eyebrow">Authentication required</p>
            <h1>Sign in to check out</h1>
            <p>
              Your guest cart is safe. After signing in, you can return here and
              complete the simulated checkout.
            </p>
            <Link
              href="/login?returnTo=/checkout"
              className="button button-primary"
            >
              Sign in securely
            </Link>
          </div>
        </section>
      </main>
    );

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Home</Link>
            <Link href="/cart">Cart</Link>
            <span>Checkout</span>
          </div>
          <h1>Checkout</h1>
          <p>
            Confirm delivery information and choose a harmless simulated payment
            result.
          </p>
        </div>
      </section>
      <section className="section">
        <form className="container two-column" onSubmit={submit}>
          <div>
            <div className="form-card">
              <h2>Contact and delivery</h2>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    name="name"
                    required
                    defaultValue={user.name}
                    autoComplete="name"
                  />
                </div>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    required
                    type="email"
                    defaultValue={user.email}
                    autoComplete="email"
                  />
                </div>
                <div className="field full">
                  <label htmlFor="address">Street address</label>
                  <input
                    id="address"
                    name="address"
                    required
                    defaultValue="123 Riverside Avenue"
                    autoComplete="street-address"
                  />
                </div>
                <div className="field">
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    name="city"
                    required
                    defaultValue="Phnom Penh"
                    autoComplete="address-level2"
                  />
                </div>
                <div className="field">
                  <label htmlFor="country">Country</label>
                  <select id="country" name="country" defaultValue="Cambodia">
                    <option>Cambodia</option>
                    <option>Singapore</option>
                    <option>Thailand</option>
                    <option>Vietnam</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="form-card">
              <h2>Simulated payment</h2>
              <div className="radio-cards">
                <label className="radio-card">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={payment === "cod"}
                    onChange={(event) => setPayment(event.target.value)}
                  />
                  <Truck size={21} />
                  <span>
                    <b>Cash on delivery</b>
                    <br />
                    <small>Pay only in this fictional checkout flow</small>
                  </span>
                </label>
                <label className="radio-card">
                  <input
                    type="radio"
                    name="payment"
                    value="test-approved"
                    checked={payment === "test-approved"}
                    onChange={(event) => setPayment(event.target.value)}
                  />
                  <CreditCard size={21} />
                  <span>
                    <b>Test card — approve</b>
                    <br />
                    <small>No card number, code, or sensitive data</small>
                  </span>
                </label>
              </div>
              <p className="secure-note">
                <LockKeyhole size={20} /> Payment behavior is fully simulated.
                Never enter real payment information anywhere in this portfolio
                project.
              </p>
            </div>
          </div>
          <aside className="summary-card">
            <h2>Your order</h2>
            <div className="summary-lines">
              {cart.map((line) => {
                const product = productById(line.productId);
                return product ? (
                  <div key={line.productId}>
                    <span>
                      {product.name} × {line.quantity}
                    </span>
                    <span>
                      {formatMoney(
                        (product.discountCents ?? product.priceCents) *
                          line.quantity,
                      )}
                    </span>
                  </div>
                ) : null;
              })}
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
            {error && (
              <p role="alert" style={{ color: "#a83718" }}>
                {error}
              </p>
            )}
            <button
              className="button button-light"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Processing…" : "Confirm order"}
            </button>
            <p className="summary-note">
              Checkout totals and inventory are revalidated by the server in
              live mode. No real card details are collected.
            </p>
          </aside>
        </form>
      </section>
    </main>
  );
}
