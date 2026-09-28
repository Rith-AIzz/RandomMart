export type OrderEmailPayload = {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  totalFormatted: string;
  items: Array<{ name: string; quantity: number; priceFormatted: string }>;
  trackingUrl?: string;
};

export async function sendOrderConfirmationEmail(payload: OrderEmailPayload): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "RandomMart <orders@randommart.com>",
          to: [payload.toEmail],
          subject: `Order Confirmed - #${payload.orderNumber}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #14213d;">
              <h2>Thank you for your order, ${payload.customerName}!</h2>
              <p>Your order <strong>#${payload.orderNumber}</strong> has been received and is being prepared.</p>
              <h3>Order Details:</h3>
              <ul>
                ${payload.items.map((i) => `<li>${i.quantity}x ${i.name} — ${i.priceFormatted}</li>`).join("")}
              </ul>
              <p><strong>Total:</strong> ${payload.totalFormatted}</p>
              <p>If you have any questions, reply to this email or visit our help center.</p>
            </div>
          `,
        }),
      });
      return response.ok;
    } catch (err) {
      console.error("Failed to send transactional email via Resend:", err);
      return false;
    }
  }

  // Development / Log fallback
  console.log(`[EMAIL DISPATCH - ORDER CONFIRMATION] To: ${payload.toEmail} | Order: ${payload.orderNumber} | Total: ${payload.totalFormatted}`);
  return true;
}

export async function sendShippingUpdateEmail(payload: OrderEmailPayload): Promise<boolean> {
  console.log(`[EMAIL DISPATCH - SHIPPING UPDATE] To: ${payload.toEmail} | Order: ${payload.orderNumber} | Tracking: ${payload.trackingUrl || "N/A"}`);
  return true;
}

export async function sendRefundConfirmationEmail(payload: OrderEmailPayload): Promise<boolean> {
  console.log(`[EMAIL DISPATCH - REFUND CONFIRMATION] To: ${payload.toEmail} | Order: ${payload.orderNumber} | Refunded: ${payload.totalFormatted}`);
  return true;
}
