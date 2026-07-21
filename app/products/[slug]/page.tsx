import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RefreshCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { AddToCart } from "../../../components/add-to-cart";
import { ProductCard } from "../../../components/product-card";
import { effectivePrice } from "../../../lib/commerce";
import { categoryName, formatMoney, productBySlug, products } from "../../../lib/products";

export function generateStaticParams() { return products.map((product) => ({ slug: product.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const product = productBySlug((await params).slug); return product ? { title: product.name, description: product.shortDescription } : { title: "Product not found" }; }

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = productBySlug((await params).slug);
  if (!product) notFound();
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4);
  return <main>
    <section className="detail-section"><div className="container">
      <div className="breadcrumbs"><Link href="/">Home</Link><Link href="/products">Shop</Link><Link href={`/products?category=${product.category}`}>{categoryName(product.category)}</Link><span>{product.name}</span></div>
      <div className="product-detail">
        <div className="detail-image"><img src={product.image} alt={`Editorial view of ${product.name}`} style={{ objectPosition: product.imagePosition }} /></div>
        <div className="detail-copy"><p className="eyebrow">{categoryName(product.category)} · {product.sku}</p><h1>{product.name}</h1><div className="detail-rating"><Star size={17} fill="currentColor" /> {product.rating} <span>· 24 verified demo reviews</span></div><p className="detail-price">{formatMoney(effectivePrice(product))}{product.discountCents !== undefined && <del>{formatMoney(product.priceCents)}</del>}</p><p className="detail-description">{product.description}</p><div className="detail-meta"><span><b>Availability</b><span>{product.stock === 0 ? "Out of stock" : product.stock <= 8 ? `Low stock — ${product.stock} remaining` : "In stock"}</span></span><span><b>Category</b><span>{categoryName(product.category)}</span></span><span><b>Shipping</b><span>Free when your order reaches $75</span></span></div><div className="detail-actions"><AddToCart productId={product.id} disabled={product.stock === 0} label="Add to cart" /><Link href="/cart" className="button button-outline">View cart</Link></div><div className="reassurance"><div><Truck size={19} /><br />Fast demo shipping</div><div><RefreshCcw size={19} /><br />30-day returns</div><div><ShieldCheck size={19} /><br />Safe checkout</div></div></div>
      </div>
    </div></section>
    <section className="section section-white"><div className="container"><div className="section-heading"><div><p className="eyebrow">Keep browsing</p><h2>More from {categoryName(product.category)}</h2></div><Link href={`/products?category=${product.category}`} className="text-link">View category</Link></div><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></div></section>
  </main>;
}
