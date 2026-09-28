import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { CategoryCard } from "../components/category-card";
import { ProductCard } from "../components/product-card";
import { getCatalogCategories, getCatalogProducts } from "../lib/catalog";

export default async function Home() {
  const products = await getCatalogProducts();
  const categories = await getCatalogCategories();
  const featured = products.filter((product) => product.featured).slice(0, 4);
  const deals = products
    .filter((product) => product.discountCents !== undefined)
    .slice(0, 4);
  return (
    <main>
      <section className="hero">
        <Image
          src="/images/randommart-hero.png"
          alt="Warm editorial collection of a speaker, headphones, books and homeware"
          className="hero-image"
          fill
          priority
          sizes="100vw"
        />
        <div className="container hero-content">
          <div className="hero-copy">
            <p className="pill">
              <Sparkles size={16} aria-hidden="true" /> New season picks
            </p>
            <h1>
              Everything you need,
              <br />
              all in one place.
            </h1>
            <p>
              Discover everyday essentials and unexpected finds, thoughtfully
              selected for every part of life.
            </p>
            <div className="hero-actions">
              <Link href="/products" className="button button-primary">
                Shop now <ArrowRight size={19} />
              </Link>
              <Link href="#categories" className="text-link">
                Browse categories
              </Link>
            </div>
            <div className="hero-proof">
              <span>
                <Check size={15} /> Secure simulated checkout
              </span>
              <span>
                <Check size={15} /> Free shipping over $75
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="category-strip section" id="categories">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Find your corner</p>
              <h2>Shop by category</h2>
            </div>
            <Link href="/products" className="text-link">
              View everything <ArrowRight size={17} />
            </Link>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-white">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Customer favorites</p>
              <h2>Good choices, made easy</h2>
            </div>
            <p>Our most-loved finds across every category.</p>
          </div>
          <div className="product-grid">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="story-section section">
        <div className="container story-grid">
          <div className="story-image-wrap">
            <Image
              src="/images/randommart-products-b.png"
              alt="Warm flat-lay of clothing, books and home accessories"
              fill
              sizes="(max-width: 800px) 100vw, 50vw"
            />
            <span className="story-stamp">
              Curated
              <br />
              with care
            </span>
          </div>
          <div className="story-copy">
            <p className="eyebrow">The RandomMart edit</p>
            <h2>
              Less endless scrolling.
              <br />
              More things worth finding.
            </h2>
            <p>
              RandomMart brings useful, beautiful, and pleasantly unexpected
              products together. Every collection is organized to make browsing
              simple and discovering something new feel fun again.
            </p>
            <ul>
              <li>
                <Check /> Practical products with personality
              </li>
              <li>
                <Check /> Clear prices and honest stock updates
              </li>
              <li>
                <Check /> A calmer way to shop online
              </li>
            </ul>
            <Link href="/products" className="button button-outline">
              Explore the collection <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-white" id="deals">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Worth a look</p>
              <h2>Current offers</h2>
            </div>
            <p>Small prices on genuinely good things.</p>
          </div>
          <div className="product-grid">
            {deals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="service-strip">
        <div className="container service-grid">
          <div>
            <Truck />
            <span>
              <b>Free shipping</b>
              <small>On orders over $75</small>
            </span>
          </div>
          <div>
            <RefreshCcw />
            <span>
              <b>Simple returns</b>
              <small>30-day sample policy</small>
            </span>
          </div>
          <div>
            <ShieldCheck />
            <span>
              <b>Secure by design</b>
              <small>No real card data collected</small>
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
