"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "../lib/products";

type OrderRow = {
  id: string;
  number: string;
  customer: string;
  date: string;
  status: string;
  payment: string;
  total: number;
  refundedCents: number;
  cancellationReason?: string | null;
};
type Filters = { status: string; from: string; to: string; q: string };
const transitions: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
};

export function AdminOrderManager({
  orders,
  liveMode,
  filters,
}: {
  orders: OrderRow[];
  liveMode: boolean;
  filters: Filters;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const mutate = async (id: string, body: Record<string, unknown>) => {
    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as { message?: string };
    setMessage(
      response.ok
        ? "Order updated."
        : (result.message ?? "Unable to update order."),
    );
    if (response.ok) router.refresh();
  };
  const updateStatus = async (id: string, status: string) => {
    const cancellationReason =
      status === "CANCELLED"
        ? window.prompt("Why is this order being cancelled?")?.trim()
        : undefined;
    if (status === "CANCELLED" && !cancellationReason)
      return setMessage("A cancellation reason is required.");
    await mutate(id, { status, cancellationReason });
  };

  return (
    <>
      <div className="admin-title">
        <div>
          <p className="eyebrow">Order management</p>
          <h1>Orders</h1>
        </div>
        <span className="status">{orders.length} results</span>
      </div>
      <form className="admin-filter-bar" action="/admin/orders" method="get">
        <label>
          Search
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Order or customer"
          />
        </label>
        <label>
          Status
          <select name="status" defaultValue={filters.status}>
            <option value="">All statuses</option>
            {[
              "PENDING",
              "CONFIRMED",
              "PROCESSING",
              "SHIPPED",
              "DELIVERED",
              "CANCELLED",
            ].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label>
          From
          <input name="from" type="date" defaultValue={filters.from} />
        </label>
        <label>
          To
          <input name="to" type="date" defaultValue={filters.to} />
        </label>
        <button className="button button-outline" type="submit">
          Filter
        </button>
      </form>
      {message && (
        <p role="status" className="secure-note">
          {message}
        </p>
      )}
      <div className="admin-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Refunded</th>
                <th>Next step</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <b>{order.number}</b>
                    {order.cancellationReason && (
                      <small className="table-note">
                        Reason: {order.cancellationReason}
                      </small>
                    )}
                  </td>
                  <td>{order.customer}</td>
                  <td>{order.date}</td>
                  <td>
                    <span className="status">{order.status}</span>
                  </td>
                  <td>{order.payment}</td>
                  <td>{formatMoney(order.total)}</td>
                  <td>
                    {formatMoney(order.refundedCents)}
                    {liveMode && (
                      <form
                        className="inline-refund"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const cents = Math.round(
                            Number(
                              new FormData(event.currentTarget).get("refund"),
                            ) * 100,
                          );
                          void mutate(order.id, { refundedCents: cents });
                        }}
                      >
                        <input
                          name="refund"
                          aria-label={`Refund for ${order.number}`}
                          type="number"
                          min="0"
                          max={order.total / 100}
                          step="0.01"
                          defaultValue={order.refundedCents / 100}
                        />
                        <button type="submit">Save</button>
                      </form>
                    )}
                  </td>
                  <td>
                    {liveMode && transitions[order.status]?.length ? (
                      <select
                        aria-label={`Update ${order.number}`}
                        defaultValue=""
                        onChange={(event) =>
                          event.target.value &&
                          void updateStatus(order.id, event.target.value)
                        }
                      >
                        <option value="" disabled>
                          Choose…
                        </option>
                        {transitions[order.status].map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
