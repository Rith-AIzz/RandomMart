"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppRole } from "../lib/permissions";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  orders: number;
  role: AppRole;
  joined: string;
};
const roles: AppRole[] = ["CUSTOMER", "SUPPORT", "MANAGER", "ADMIN"];

export function AdminCustomerManager({
  customers,
  canManageRoles,
}: {
  customers: CustomerRow[];
  canManageRoles: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const updateRole = async (id: string, role: AppRole) => {
    const response = await fetch(`/api/admin/customers/${id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const body = (await response.json()) as { message?: string };
    setMessage(
      response.ok
        ? "Role updated."
        : (body.message ?? "Unable to update role."),
    );
    if (response.ok) router.refresh();
  };
  return (
    <>
      <div className="admin-title">
        <div>
          <p className="eyebrow">Customer directory</p>
          <h1>Customers and staff</h1>
        </div>
        <span className="status">Sensitive auth fields hidden</span>
      </div>
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
                <th>Customer</th>
                <th>Email</th>
                <th>Orders</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <b>{customer.name}</b>
                  </td>
                  <td>{customer.email}</td>
                  <td>{customer.orders}</td>
                  <td>
                    {canManageRoles ? (
                      <select
                        aria-label={`Role for ${customer.name}`}
                        value={customer.role}
                        onChange={(event) =>
                          void updateRole(
                            customer.id,
                            event.target.value as AppRole,
                          )
                        }
                      >
                        {roles.map((role) => (
                          <option key={role}>{role}</option>
                        ))}
                      </select>
                    ) : (
                      customer.role
                    )}
                  </td>
                  <td>{customer.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
