import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { ProductCard } from "../../components/product-card";
import { categories, products } from "../../lib/products";
import { effectivePrice } from "../../lib/commerce";

export const metadata: Metadata = { title: "Shop all products", description: "Browse electronics, clothing, books, accessories, homeware, and curious finds." };

type Params = { q?: string; category?: string; min?: string; max?: string; sort?: string; featured?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = params.q?.trim().toLowerCase() ?? "";
  const min = Number(params.min || 0) * 100;
  const max = Number(params.max || Number.MAX_SAFE_INTEGER) * 100;
  let result = products.filter((product) => {
    const haystack = `${product.name} ${product.sku} ${product.shortDescription} ${product.description}`.toLowerCase();
    return (!q || haystack.includes(q)) && (!params.category || product.category === params.category) && effectivePrice(product) >= min && effectivePrice(product) <= max && (!params.featured || product.featured);
  });
  result = [...result].sort((a, b) => params.sort === "price-low" ? effectivePrice(a) - effectivePrice(b) : params.sort === "price-high" ? effectivePrice(b) - effectivePrice(a) : params.sort === "name" ? a.name.localeCompare(b.name) : b.id.localeCompare(a.id));

  return <main>
    <section className="page-hero"><div className="container"><div className="breadcrumbs"><Link href="/">Home</Link><span>Shop</span></div><h1>Find your next good thing.</h1><p>Browse all twenty hand-picked products, narrow the collection, or search for exactly what you need.</p></div></section>
    <section className="section"><div className="container catalog-layout">
      <form className="filter-panel" method="get">
        <h2>Filter products</h2>
        <div className="field"><label htmlFor="filter-search">Search</label><input id="filter-search" name="q" defaultValue={params.q} placeholder="Name, SKU, description" /></div>
        <div className="field"><label htmlFor="filter-category">Category</label><select id="filter-category" name="category" defaultValue={params.category ?? ""}><option value="">All categories</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></div>
        <div className="field"><label htmlFor="filter-min">Minimum price</label><input id="filter-min" type="number" min="0" step="1" name="min" defaultValue={params.min} placeholder="$0" /></div>
        <div className="field"><label htmlFor="filter-max">Maximum price</label><input id="filter-max" type="number" min="0" step="1" name="max" defaultValue={params.max} placeholder="Any price" /></div>
        <label className="radio-card"><input type="checkbox" name="featured" value="1" defaultChecked={params.featured === "1"} /> Featured only</label>
        <input type="hidden" name="sort" value={params.sort ?? "newest"} />
        <div className="filter-actions"><button className="button button-primary" type="submit">Apply filters</button><Link href="/products" className="button button-outline">Clear all</Link></div>
      </form>
      <div>
        <div className="catalog-header"><p><strong>{result.length}</strong> product{result.length === 1 ? "" : "s"} found</p><form><input type="hidden" name="q" value={params.q ?? ""} /><input type="hidden" name="category" value={params.category ?? ""} /><label htmlFor="sort" className="sr-only">Sort products</label><select id="sort" name="sort" defaultValue={params.sort ?? "newest"} onChange={undefined}><option value="newest">Newest first</option><option value="name">Alphabetical</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select><button className="sr-only" type="submit">Apply sort</button></form></div>
        <div className="product-grid catalog-products">
          {result.length ? result.map((product) => <ProductCard key={product.id} product={product} />) : <div className="empty-state"><SearchX size={40} /><h2>No products found</h2><p>Try changing your search or clearing one of the filters.</p><Link href="/products" className="button button-primary">Clear filters</Link></div>}
        </div>
      </div>
    </div></section>
  </main>;
}
