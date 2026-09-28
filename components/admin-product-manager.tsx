"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { formatMoney } from "../lib/products";

type Row = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  priceCents: number;
  costCents: number;
  stock: number;
  active: boolean;
};
type Category = { id: string; name: string };

export function AdminProductManager({
  products,
  categories,
  liveMode,
}: {
  products: Row[];
  categories: Category[];
  liveMode: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        slug: form.get("slug"),
        sku: form.get("sku"),
        shortDescription: form.get("shortDescription"),
        description: form.get("description"),
        priceCents: Math.round(Number(form.get("price")) * 100),
        costCents: Math.round(Number(form.get("cost")) * 100),
        stockQuantity: Number(form.get("stock")),
        categoryId: form.get("categoryId"),
      }),
    });
    const body = (await response.json()) as { message?: string };
    setMessage(
      response.ok
        ? "Product created."
        : (body.message ?? "Unable to create product."),
    );
    if (response.ok) {
      event.currentTarget.reset();
      setOpen(false);
      router.refresh();
    }
  };
  const archive = async (id: string) => {
    if (
      !window.confirm(
        "Archive this product? Existing order history will be preserved.",
      )
    )
      return;
    const response = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });
    if (response.ok) router.refresh();
    else setMessage("Unable to archive product.");
  };
  return (
    <>
      <div className="admin-title">
        <div>
          <p className="eyebrow">Catalog management</p>
          <h1>Products</h1>
        </div>
        <button
          className="button button-primary"
          type="button"
          disabled={!liveMode}
          onClick={() => setOpen((value) => !value)}
        >
          <Plus size={17} /> New product
        </button>
      </div>
      {!liveMode && (
        <p className="secure-note">
          Connect Supabase to enable catalog mutations. Sample data remains
          read-only.
        </p>
      )}
      {message && (
        <p role="status" className="secure-note">
          {message}
        </p>
      )}
      {open && (
        <form className="form-card" onSubmit={submit}>
          <h2>Create product</h2>
          <div className="form-grid">
            <div className="field">
              <label>
                Name
                <input name="name" required minLength={2} />
              </label>
            </div>
            <div className="field">
              <label>
                Slug
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                />
              </label>
            </div>
            <div className="field">
              <label>
                SKU
                <input name="sku" required minLength={3} />
              </label>
            </div>
            <div className="field">
              <label>
                Category
                <select name="categoryId" required>
                  {categories.map((category) => (
                    <option value={category.id} key={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="field">
              <label>
                Price (USD)
                <input
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                />
              </label>
            </div>
            <div className="field">
              <label>
                Cost (USD)
                <input name="cost" type="number" min="0" step="0.01" required />
              </label>
            </div>
            <div className="field">
              <label>
                Stock
                <input name="stock" type="number" min="0" step="1" required />
              </label>
            </div>
            <div className="field full">
              <label>
                Short description
                <input name="shortDescription" required minLength={10} />
              </label>
            </div>
            <div className="field full">
              <label>
                Description
                <textarea name="description" required minLength={20} rows={4} />
              </label>
            </div>
          </div>
          <button className="button button-primary">Save product</button>
        </form>
      )}
      <div className="admin-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Cost</th>
                <th>Margin</th>
                <th>Stock</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link href={`/products/${product.slug}`}>
                      <b>{product.name}</b>
                    </Link>
                  </td>
                  <td>{product.sku}</td>
                  <td>{product.category}</td>
                  <td>{formatMoney(product.priceCents)}</td>
                  <td>{formatMoney(product.costCents)}</td>
                  <td>
                    {product.priceCents
                      ? `${Math.round(((product.priceCents - product.costCents) / product.priceCents) * 100)}%`
                      : "—"}
                  </td>
                  <td>{product.stock}</td>
                  <td>
                    <span className="status">
                      {product.active ? "Active" : "Archived"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {liveMode && product.active && (
                      <>
                        <button
                          className="remove-button"
                          type="button"
                          aria-label={`Edit ${product.name}`}
                          title="Quick update price & stock"
                          onClick={async () => {
                            const newPriceStr = window.prompt(`New Price in USD for ${product.name}:`, (product.priceCents / 100).toFixed(2));
                            if (newPriceStr === null) return;
                            const newStockStr = window.prompt(`New Stock Quantity for ${product.name}:`, String(product.stock));
                            if (newStockStr === null) return;

                            const priceCents = Math.round(Number(newPriceStr) * 100);
                            const stockQuantity = Number.parseInt(newStockStr, 10);
                            if (Number.isNaN(priceCents) || Number.isNaN(stockQuantity) || priceCents <= 0 || stockQuantity < 0) {
                              setMessage("Invalid price or stock input.");
                              return;
                            }

                            const res = await fetch(`/api/admin/products/${product.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ priceCents, stockQuantity }),
                            });
                            if (res.ok) {
                              setMessage(`Updated ${product.name}.`);
                              router.refresh();
                            } else {
                              setMessage(`Failed to update ${product.name}.`);
                            }
                          }}
                        >
                          ✎
                        </button>
                        <button
                          className="remove-button"
                          type="button"
                          aria-label={`Archive ${product.name}`}
                          onClick={() => archive(product.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
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
