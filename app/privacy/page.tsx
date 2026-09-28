import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | RandomMart",
  description: "Learn how RandomMart protects, uses, and safeguards your personal information.",
};

export default function PrivacyPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Home</Link>
            <span>Privacy Policy</span>
          </div>
          <h1>Privacy Policy</h1>
          <p>Effective date: August 13, 2026. Your privacy and trust are our top priorities.</p>
        </div>
      </section>
      <section className="section section-white">
        <div className="container" style={{ maxWidth: "800px" }}>
          <h2>1. Information We Collect</h2>
          <p>
            When you visit RandomMart or place an order, we collect information necessary to process your transaction and provide a secure shopping experience:
          </p>
          <ul>
            <li><strong>Account & Order Data:</strong> Full name, email address, shipping address, and phone number.</li>
            <li><strong>Payment Data:</strong> Payment parameters processed securely via our payment gateways. We never store raw credit card numbers or security codes.</li>
            <li><strong>Technical Data:</strong> IP address, device type, browser information, and essential cookies for session handling.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use your personal data strictly for operational e-commerce purposes:</p>
          <ul>
            <li>Fulfilling and tracking your orders and shipping deliveries.</li>
            <li>Sending transactional emails (order confirmations, shipping updates, account notices).</li>
            <li>Detecting and preventing fraud, security incidents, and unauthorized access.</li>
            <li>Improving site performance, navigation, and customer service.</li>
          </ul>

          <h2>3. Data Protection & Security</h2>
          <p>
            We implement strict technical and organizational safeguards:
          </p>
          <ul>
            <li>All data transfers are encrypted via HTTPS with TLS 1.3 encryption.</li>
            <li>Authentication and user sessions are managed securely via HttpOnly credentials.</li>
            <li>We do not sell, rent, or trade customer data to third-party data brokers.</li>
          </ul>

          <h2>4. Your Rights</h2>
          <p>
            You have the right to access, export, update, or request deletion of your personal account information at any time through your Profile page or by contacting support.
          </p>

          <h2>5. Contact Us</h2>
          <p>
            If you have any questions regarding our Privacy Policy or data handling practices, please email us at <a href="mailto:privacy@randommart.example" className="text-link">privacy@randommart.example</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
