"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
  active: boolean;
};

export function AdminCategoryManager({
  categories,
  liveMode,
}: {
  categories: CategoryRow[];
  liveMode: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        slug: form.get("slug"),
        description: form.get("description"),
      }),
    });
    const body = (await response.json()) as { message?: string };
    setMessage(
      response.ok
        ? "Category created."
        : (body.message ?? "Unable to create category."),
    );
    if (response.ok) {
      event.currentTarget.reset();
      router.refresh();
    }
  };
  const archive = async (id: string) => {
    if (
      !window.confirm(
        "Archive this category? Its existing products are preserved.",
      )
    )
      return;
    const response = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });
    setMessage(
      response.ok ? "Category archived." : "Unable to archive category.",
    );
    if (response.ok) router.refresh();
  };
  return (
    <>
      <div className="admin-title">
        <div>
          <p className="eyebrow">Catalog structure</p>
          <h1>Categories</h1>
        </div>
      </div>
      {liveMode && (
        <form className="form-card" onSubmit={submit}>
          <div className="form-grid">
            <div className="field">
              <label>
                Name
                <input name="name" required />
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
            <div className="field full">
              <label>
                Description
                <input name="description" />
              </label>
            </div>
          </div>
          <button className="button button-primary">Create category</button>
        </form>
      )}
      {!liveMode && (
        <p className="secure-note">Connect Supabase to create categories.</p>
      )}
      {message && <p role="status">{message}</p>}
      <div className="stats-grid">
        {categories.map((category) => (
          <div className="stat-card" key={category.id}>
            <span>
              {category.name} {!category.active && <small>Archived</small>}
            </span>
            <strong>{category.count}</strong>
            <small>{category.description}</small>
            {liveMode && category.active && (
              <button
                className="button button-outline"
                type="button"
                onClick={() => archive(category.id)}
              >
                Archive
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
