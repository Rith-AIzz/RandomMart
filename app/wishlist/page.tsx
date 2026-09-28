"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductCard } from "../../components/product-card";
import { useStore } from "../../components/store-provider";

export default function WishlistPage() {
  const { wishlist, products } = useStore();
  const saved = products.filter((product) => wishlist.includes(product.id));
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Home</Link>
            <span>Saved items</span>
          </div>
          <h1>Saved items</h1>
          <p>Keep track of the finds you want to revisit.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          {saved.length ? (
            <div className="product-grid">
              {saved.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Heart size={42} />
              <h2>Nothing saved yet</h2>
              <p>Tap the heart on a product to keep it here.</p>
              <Link href="/products" className="button button-primary">
                Explore products
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
