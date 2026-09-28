"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InventoryRow = {
  id: string;
  name: string;
  category: string;
  sku: string;
  stock: number;
};

export function AdminInventoryManager({
  products,
  liveMode,
}: {
  products: InventoryRow[];
  liveMode: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const update = async (id: string, stockQuantity: number) => {
    const response = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQuantity }),
    });
    const body = (await response.json()) as { message?: string };
    setMessage(
      response.ok
        ? "Inventory updated."
        : (body.message ?? "Unable to update inventory."),
    );
    if (response.ok) router.refresh();
  };
  return (
    <>
      <div className="admin-title">
        <div>
          <p className="eyebrow">Stock monitoring</p>
          <h1>Inventory</h1>
        </div>
        <span className="status">
          {products.filter((product) => product.stock <= 8).length} need
          attention
        </span>
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
                <th>Product</th>
                <th>Category</th>
                <th>SKU</th>
                <th>On hand</th>
                <th>Level</th>
                <th>Adjust</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <b>{product.name}</b>
                  </td>
                  <td>{product.category}</td>
                  <td>{product.sku}</td>
                  <td>{product.stock}</td>
                  <td>
                    <span className="status">
                      {product.stock === 0
                        ? "Out of stock"
                        : product.stock <= 8
                          ? "Low stock"
                          : "Healthy"}
                    </span>
                  </td>
                  <td>
                    {liveMode ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          const value = Number(
                            new FormData(event.currentTarget).get("stock"),
                          );
                          void update(product.id, value);
                        }}
                      >
                        <input
                          name="stock"
                          aria-label={`Stock for ${product.name}`}
                          type="number"
                          min="0"
                          step="1"
                          defaultValue={product.stock}
                          style={{ width: 80 }}
                        />{" "}
                        <button className="button button-outline">Save</button>
                      </form>
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
