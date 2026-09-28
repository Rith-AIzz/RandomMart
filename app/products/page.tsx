import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { ProductCard } from "../../components/product-card";
import { CatalogSort } from "../../components/catalog-sort";
import { getCatalogCategories, getCatalogPage } from "../../lib/catalog";

export const metadata: Metadata = {
  title: "Shop all products",
  description:
    "Browse electronics, clothing, books, accessories, homeware, and curious finds.",
};

type Params = {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  sort?: string;
  featured?: string;
  page?: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const categories = await getCatalogCategories();
  const {
    products: result,
    total,
    page,
    pageCount,
  } = await getCatalogPage(params);
  const pageHref = (nextPage: number) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === "string" && entry[1].length > 0,
      ),
    );
    query.set("page", String(nextPage));
    return `/products?${query.toString()}`;
  };
  const sortQuery = Object.entries(params).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === "string" && entry[1].length > 0,
  );

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Home</Link>
            <span>Shop</span>
          </div>
          <h1>Find your next good thing.</h1>
          <p>
            Browse all twenty hand-picked products, narrow the collection, or
            search for exactly what you need.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container catalog-layout">
          <form className="filter-panel" method="get">
            <h2>Filter products</h2>
            <div className="field">
              <label htmlFor="filter-search">Search</label>
              <input
                id="filter-search"
                name="q"
                defaultValue={params.q}
                placeholder="Name, SKU, description"
              />
            </div>
            <div className="field">
              <label htmlFor="filter-category">Category</label>
              <select
                id="filter-category"
                name="category"
                defaultValue={params.category ?? ""}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="filter-min">Minimum price</label>
              <input
                id="filter-min"
                type="number"
                min="0"
                step="1"
                name="min"
                defaultValue={params.min}
                placeholder="$0"
              />
            </div>
            <div className="field">
              <label htmlFor="filter-max">Maximum price</label>
              <input
                id="filter-max"
                type="number"
                min="0"
                step="1"
                name="max"
                defaultValue={params.max}
                placeholder="Any price"
              />
            </div>
            <label className="radio-card">
              <input
                type="checkbox"
                name="featured"
                value="1"
                defaultChecked={params.featured === "1"}
              />{" "}
              Featured only
            </label>
            <input type="hidden" name="sort" value={params.sort ?? "newest"} />
            <div className="filter-actions">
              <button className="button button-primary" type="submit">
                Apply filters
              </button>
              <Link href="/products" className="button button-outline">
                Clear all
              </Link>
            </div>
          </form>
          <div>
            <div className="catalog-header">
              <p>
                <strong>{total}</strong> product{total === 1 ? "" : "s"} found
              </p>
              <CatalogSort
                value={params.sort ?? "newest"}
                query={sortQuery}
              />
            </div>
            <div className="product-grid catalog-products">
              {result.length ? (
                result.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="empty-state">
                  <SearchX size={40} />
                  <h2>No products found</h2>
                  <p>
                    Try changing your search or clearing one of the filters.
                  </p>
                  <Link href="/products" className="button button-primary">
                    Clear filters
                  </Link>
                </div>
              )}
            </div>
            {pageCount > 1 && (
              <nav className="pagination" aria-label="Product pages">
                <Link
                  className="button button-outline"
                  aria-disabled={page === 1}
                  href={pageHref(Math.max(1, page - 1))}
                >
                  Previous
                </Link>
                <span>
                  Page {page} of {pageCount}
                </span>
                <Link
                  className="button button-outline"
                  aria-disabled={page === pageCount}
                  href={pageHref(Math.min(pageCount, page + 1))}
                >
                  Next
                </Link>
              </nav>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
