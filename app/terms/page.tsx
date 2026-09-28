import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | RandomMart",
  description: "Read the Terms of Service governing purchases and use of the RandomMart platform.",
};

export default function TermsPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Home</Link>
            <span>Terms of Service</span>
          </div>
          <h1>Terms of Service</h1>
          <p>Effective date: August 13, 2026. Please read these terms carefully before placing an order.</p>
        </div>
      </section>
      <section className="section section-white">
        <div className="container" style={{ maxWidth: "800px" }}>
          <h2>1. Overview</h2>
          <p>
            By accessing or using RandomMart, you agree to be bound by these Terms of Service. These terms apply to all visitors, registered users, and customers.
          </p>

          <h2>2. Orders & Pricing</h2>
          <p>
            All products and prices listed on RandomMart are subject to availability. Prices are stated in USD. We reserve the right to correct typographical pricing errors before order confirmation.
          </p>

          <h2>3. Payment & Order Validation</h2>
          <p>
            All payments must be verified and approved prior to shipment. Orders are confirmed only after successful payment processing or valid Cash on Delivery confirmation.
          </p>

          <h2>4. Shipping & Delivery</h2>
          <p>
            Estimated delivery dates are provided for informational purposes. Actual delivery times depend on shipping destination and carrier service availability.
          </p>

          <h2>5. Returns & Refunds</h2>
          <p>
            Purchases are covered by our 30-Day Return & Refund Policy. Returned items must be in original condition with proof of purchase.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            RandomMart is provided "as is" without implied warranties beyond statutory rights. We are not liable for indirect or consequential damages arising from site usage.
          </p>

          <h2>7. Contact Information</h2>
          <p>
            Questions regarding terms should be sent to <a href="mailto:support@randommart.example" className="text-link">support@randommart.example</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
