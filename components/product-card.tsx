import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { categoryName, formatMoney, type Product } from "../lib/products";
import { effectivePrice } from "../lib/commerce";
import { AddToCart } from "./add-to-cart";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({ product }: { product: Product }) {
  const onSale = product.discountCents !== undefined;
  return (
    <article className="product-card">
      <Link
        href={`/products/${product.slug}`}
        className="product-image-link"
        aria-label={`View ${product.name}`}
      >
        <Image
          src={product.image}
          alt={product.name}
          className="product-image"
          style={{ objectPosition: product.imagePosition }}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw"
        />
        <div className="product-badges">
          {onSale && (
            <span className="badge badge-sale">
              Save {formatMoney(product.priceCents - effectivePrice(product))}
            </span>
          )}
          {product.stock === 0 ? (
            <span className="badge badge-dark">Out of stock</span>
          ) : product.stock <= 8 ? (
            <span className="badge badge-warm">Only {product.stock} left</span>
          ) : null}
        </div>
      </Link>
      <WishlistButton productId={product.id} className="product-wishlist" />
      <div className="product-card-body">
        <div>
          <p className="eyebrow">{categoryName(product.category)}</p>
          <Link href={`/products/${product.slug}`} className="product-title">
            {product.name}
          </Link>
          <div className="rating">
            <Star size={14} fill="currentColor" aria-hidden="true" />
            <span>{product.rating}</span>
          </div>
        </div>
        <p className="product-description">{product.shortDescription}</p>
        <div className="product-card-footer">
          <p className="price">
            {formatMoney(effectivePrice(product))}
            {onSale && <del>{formatMoney(product.priceCents)}</del>}
          </p>
          <AddToCart
            productId={product.id}
            disabled={product.stock === 0}
            label="Add to bag"
            className="add-button"
          />
        </div>
      </div>
    </article>
  );
}
