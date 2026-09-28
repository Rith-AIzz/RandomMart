"use client";

import { useRouter } from "next/navigation";

export function CatalogSort({
  value,
  query,
}: {
  value: string;
  query: [string, string][];
}) {
  const router = useRouter();

  return (
    <label className="catalog-sort">
      <span className="sr-only">Sort products</span>
      <select
        value={value}
        onChange={(event) => {
          const nextQuery = new URLSearchParams(query);
          nextQuery.set("sort", event.currentTarget.value);
          nextQuery.delete("page");
          router.push(`/products?${nextQuery.toString()}`);
        }}
      >
        <option value="newest">Newest first</option>
        <option value="name">Alphabetical</option>
        <option value="price-low">Price: low to high</option>
        <option value="price-high">Price: high to low</option>
      </select>
    </label>
  );
}
