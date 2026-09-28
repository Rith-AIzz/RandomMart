import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping Policy | RandomMart",
  description: "Shipping options, rates, free shipping limits, and delivery times at RandomMart.",
};

export default function ShippingPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Home</Link>
            <span>Shipping Policy</span>
          </div>
          <h1>Shipping Information & Policy</h1>
          <p>Fast, transparent, and reliable delivery across all orders.</p>
        </div>
      </section>
      <section className="section section-white">
        <div className="container" style={{ maxWidth: "800px" }}>
          <h2>1. Free Shipping Threshold</h2>
          <p>
            Standard shipping is <strong>FREE on all orders over $75.00</strong>. Orders below $75.00 carry a flat standard shipping fee of <strong>$8.00</strong>.
          </p>

          <h2>2. Processing & Delivery Timelines</h2>
          <p>
            Orders are processed within 1 to 2 business days. Estimated delivery times:
          </p>
          <ul>
            <li><strong>Standard Shipping:</strong> 3 – 5 business days</li>
            <li><strong>Express Shipping:</strong> 1 – 2 business days</li>
          </ul>

          <h2>3. Order Tracking</h2>
          <p>
            Once your order ships, you will receive a tracking update with your carrier details. You can also view live tracking status on your <Link href="/orders" className="text-link">Order Details</Link> page.
          </p>

          <h2>4. Shipping Destinations</h2>
          <p>
            We ship nationwide and to select international destinations. Applicable international customs duties or taxes are calculated at checkout.
          </p>
        </div>
      </section>
    </main>
  );
}
