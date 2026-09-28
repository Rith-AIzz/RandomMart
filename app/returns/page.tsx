import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Return & Refund Policy | RandomMart",
  description: "Learn about RandomMart's 30-day hassle-free return and refund guidelines.",
};

export default function ReturnsPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Home</Link>
            <span>Return & Refund Policy</span>
          </div>
          <h1>30-Day Return & Refund Policy</h1>
          <p>We want you to love what you buy. If something isn't right, we're here to help.</p>
        </div>
      </section>
      <section className="section section-white">
        <div className="container" style={{ maxWidth: "800px" }}>
          <h2>1. Return Window</h2>
          <p>
            You have <strong>30 days</strong> from the date of delivery to initiate a return for an item purchased on RandomMart.
          </p>

          <h2>2. Return Eligibility</h2>
          <p>To be eligible for a return:</p>
          <ul>
            <li>The item must be unused, unwashed, and in its original packaging.</li>
            <li>Original tags and labels must remain intact.</li>
            <li>Proof of purchase (order number or email receipt) is required.</li>
          </ul>

          <h2>3. How to Request a Return</h2>
          <p>
            Navigate to your <Link href="/orders" className="text-link">Order History</Link>, locate the relevant order, and click "Request Return" or contact customer support at <a href="mailto:returns@randommart.example" className="text-link">returns@randommart.example</a>.
          </p>

          <h2>4. Refund Processing</h2>
          <p>
            Once your returned item is received and inspected, your refund will be processed to your original payment method within 3 to 5 business days.
          </p>

          <h2>5. Damaged or Defective Items</h2>
          <p>
            If your order arrives damaged or defective, please contact us immediately with photos of the issue for an immediate replacement or full refund.
          </p>
        </div>
      </section>
    </main>
  );
}
