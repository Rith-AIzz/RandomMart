import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { RefreshCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { AddToCart } from "../../../components/add-to-cart";
import { ProductCard } from "../../../components/product-card";
import { ReviewForm } from "../../../components/review-form";
import { effectivePrice } from "../../../lib/commerce";
import {
  categoryName,
  formatMoney,
  products as sampleProducts,
} from "../../../lib/products";
import {
  getApprovedReviews,
  getCatalogProductBySlug,
  getCatalogProducts,
} from "../../../lib/catalog";

export function generateStaticParams() {
  return sampleProducts.map((product) => ({ slug: product.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = await getCatalogProductBySlug((await params).slug);
  return product
    ? { title: product.name, description: product.shortDescription }
    : { title: "Product not found" };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const product = await getCatalogProductBySlug((await params).slug);
  if (!product) notFound();
  const products = await getCatalogProducts();
  const reviews = await getApprovedReviews(product.id);
  const related = products
    .filter(
      (item) => item.category === product.category && item.id !== product.id,
    )
    .slice(0, 4);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (effectivePrice(product) / 100).toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...(product.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.toFixed(1),
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd)
            .replaceAll("<", "\\u003c")
            .replaceAll(">", "\\u003e")
            .replaceAll("&", "\\u0026")
            .replaceAll("'", "\\u0027"),
        }}
      />
      <section className="detail-section">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Home</Link>
            <Link href="/products">Shop</Link>
            <Link href={`/products?category=${product.category}`}>
              {categoryName(product.category)}
            </Link>
            <span>{product.name}</span>
          </div>
          <div className="product-detail">
            <div className="detail-image">
              <Image
                src={product.image}
                alt={`Editorial view of ${product.name}`}
                style={{ objectPosition: product.imagePosition }}
                fill
                sizes="(max-width: 800px) 100vw, 50vw"
              />
            </div>
            <div className="detail-copy">
              <p className="eyebrow">
                {categoryName(product.category)} · {product.sku}
              </p>
              <h1>{product.name}</h1>
              <div className="detail-rating">
                <Star
                  size={17}
                  fill={product.reviewCount ? "currentColor" : "none"}
                />{" "}
                {product.reviewCount ? (
                  <>
                    {product.rating.toFixed(1)}{" "}
                    <span>
                      · {product.reviewCount} verified review
                      {product.reviewCount === 1 ? "" : "s"}
                    </span>
                  </>
                ) : (
                  <span>No reviews yet</span>
                )}
              </div>
              <p className="detail-price">
                {formatMoney(effectivePrice(product))}
                {product.discountCents !== undefined && (
                  <del>{formatMoney(product.priceCents)}</del>
                )}
              </p>
              <p className="detail-description">{product.description}</p>
              <div className="detail-meta">
                <span>
                  <b>Availability</b>
                  <span>
                    {product.stock === 0
                      ? "Out of stock"
                      : product.stock <= 8
                        ? `Low stock — ${product.stock} remaining`
                        : "In stock"}
                  </span>
                </span>
                <span>
                  <b>Category</b>
                  <span>{categoryName(product.category)}</span>
                </span>
                <span>
                  <b>Shipping</b>
                  <span>Free when your order reaches $75</span>
                </span>
              </div>
              <div className="detail-actions">
                <AddToCart
                  productId={product.id}
                  disabled={product.stock === 0}
                  label="Add to cart"
                />
                <Link href="/cart" className="button button-outline">
                  View cart
                </Link>
              </div>
              <div className="reassurance">
                <div>
                  <Truck size={19} />
                  <br />
                  Fast sample shipping
                </div>
                <div>
                  <RefreshCcw size={19} />
                  <br />
                  30-day returns
                </div>
                <div>
                  <ShieldCheck size={19} />
                  <br />
                  Safe checkout
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Verified purchases</p>
              <h2>Customer reviews</h2>
            </div>
          </div>
          {reviews.length ? (
            <div className="review-grid">
              {reviews.map((review) => (
                <article className="profile-card" key={review.id}>
                  <p className="detail-rating">
                    <Star size={16} fill="currentColor" /> {review.rating}/5
                  </p>
                  <h3>{review.title ?? "Customer review"}</h3>
                  <p>{review.body}</p>
                  <small>
                    {review.profile.fullName} ·{" "}
                    {review.createdAt.toLocaleDateString()}
                  </small>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Star size={36} />
              <h3>No approved reviews yet</h3>
              <p>
                Customers can review this product after a delivered purchase.
              </p>
            </div>
          )}
          <ReviewForm productId={product.id} />
        </div>
      </section>
      <section className="section section-white">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Keep browsing</p>
              <h2>More from {categoryName(product.category)}</h2>
            </div>
            <Link
              href={`/products?category=${product.category}`}
              className="text-link"
            >
              View category
            </Link>
          </div>
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
