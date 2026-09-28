"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Search,
  X,
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  useId,
  useMemo,
  useState,
} from "react";
import { effectivePrice } from "../lib/commerce";
import {
  categoryName,
  formatMoney,
  type Product,
} from "../lib/products";
import { useStore } from "./store-provider";

type ProductSearchProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

function rankProducts(products: Product[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [...products]
      .sort(
        (a, b) =>
          Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
          b.rating - a.rating,
      )
      .slice(0, 4);
  }

  return products
    .map((product) => {
      const name = product.name.toLowerCase();
      const category = categoryName(product.category).toLowerCase();
      let score = 0;
      if (name === needle) score += 120;
      else if (name.startsWith(needle)) score += 80;
      else if (name.split(/\s+/).some((word) => word.startsWith(needle)))
        score += 60;
      else if (name.includes(needle)) score += 45;
      if (product.sku.toLowerCase().includes(needle)) score += 35;
      if (category.includes(needle)) score += 25;
      if (product.shortDescription.toLowerCase().includes(needle)) score += 12;
      return { product, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating)
    .slice(0, 5)
    .map(({ product }) => product);
}

export function ProductSearch({
  variant = "desktop",
  onNavigate,
}: ProductSearchProps) {
  const { products } = useStore();
  const router = useRouter();
  const rawId = useId();
  const listId = `product-search-${rawId.replace(/:/g, "")}`;
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestions = useMemo(
    () => rankProducts(products, query),
    [products, query],
  );
  const trimmedQuery = query.trim();
  const resultsHref = trimmedQuery
    ? `/products?q=${encodeURIComponent(trimmedQuery)}`
    : "/products";

  const navigate = (href: string) => {
    setExpanded(false);
    setActiveIndex(-1);
    onNavigate?.();
    router.push(href);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selected = suggestions[activeIndex];
    navigate(selected ? `/products/${selected.slug}` : resultsHref);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setExpanded(false);
      setActiveIndex(-1);
      event.currentTarget.blur();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    setExpanded(true);
    setActiveIndex((current) => {
      if (!suggestions.length) return -1;
      if (event.key === "ArrowDown") return (current + 1) % suggestions.length;
      return current <= 0 ? suggestions.length - 1 : current - 1;
    });
  };

  return (
    <form
      className={`${variant === "desktop" ? "header-search" : "mobile-search"} product-search`}
      role="search"
      onSubmit={submit}
      onFocus={() => setExpanded(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setExpanded(false);
          setActiveIndex(-1);
        }
      }}
    >
      <Search size={19} aria-hidden="true" />
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search products
      </label>
      <input
        id={`${listId}-input`}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(-1);
          setExpanded(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search products"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
      />
      {query && (
        <button
          type="button"
          className="search-clear"
          aria-label="Clear search"
          onClick={() => {
            setQuery("");
            setActiveIndex(-1);
          }}
        >
          <X size={16} />
        </button>
      )}
      {expanded && (
        <div className="product-search-panel" id={listId} role="listbox">
          <div className="search-panel-heading">
            <span>{trimmedQuery ? "Top matches" : "Popular right now"}</span>
            {trimmedQuery && (
              <span>
                {suggestions.length} match{suggestions.length === 1 ? "" : "es"}
              </span>
            )}
          </div>
          {suggestions.length ? (
            <div className="search-suggestion-list">
              {suggestions.map((product, index) => (
                <a
                  key={product.id}
                  id={`${listId}-option-${index}`}
                  href={`/products/${product.slug}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`search-suggestion${index === activeIndex ? " active" : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate(`/products/${product.slug}`);
                  }}
                >
                  <span className="search-suggestion-image">
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      sizes="52px"
                      style={{ objectPosition: product.imagePosition }}
                    />
                  </span>
                  <span className="search-suggestion-copy">
                    <strong>{product.name}</strong>
                    <small>{categoryName(product.category)}</small>
                  </span>
                  <span className="search-suggestion-price">
                    {formatMoney(effectivePrice(product))}
                    {product.discountCents !== undefined && (
                      <del>{formatMoney(product.priceCents)}</del>
                    )}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="search-empty">
              No quick matches. Search the full catalog for “{trimmedQuery}”.
            </p>
          )}
          <button className="search-all" type="submit">
            <span>
              {trimmedQuery ? `View all results for “${trimmedQuery}”` : "Browse all products"}
            </span>
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      )}
    </form>
  );
}
