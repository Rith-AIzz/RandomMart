"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Heart, Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { useStore } from "./store-provider";
import { ProductSearch } from "./product-search";

const links = [
  ["/products", "Shop"],
  ["/#categories", "Categories"],
  ["/#deals", "Deals"],
  ["/#about", "About"],
];

export function SiteHeader() {
  const { cartCount, user } = useStore();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="site-header">
      <div className="header-main container">
        <Link href="/" className="wordmark" aria-label="RandomMart home">
          RandomMart
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([href, label]) => (
            <Link
              key={label}
              href={href}
              className={pathname === href ? "active" : ""}
            >
              {label}
            </Link>
          ))}
        </nav>
        <ProductSearch />
        <div className="header-actions">
          <Link
            href={user ? "/profile" : "/login"}
            className="header-action"
            aria-label={user ? `Account for ${user.name}` : "Sign in"}
          >
            <UserRound aria-hidden="true" />
            <span>{user ? user.name.split(" ")[0] : "Account"}</span>
          </Link>
          <Link
            href="/wishlist"
            className="header-action"
            aria-label="Saved items"
          >
            <Heart aria-hidden="true" />
            <span>Saved</span>
          </Link>
          <Link
            href="/cart"
            className="header-action cart-link"
            aria-label={`Cart with ${cartCount} items`}
          >
            <ShoppingBag aria-hidden="true" />
            <span>Cart</span>
            {cartCount > 0 && <b>{cartCount}</b>}
          </Link>
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <span className="sr-only">Toggle menu</span>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <div id="mobile-nav" className="mobile-nav">
          <ProductSearch variant="mobile" onNavigate={() => setOpen(false)} />
          {links.map(([href, label]) => (
            <Link key={label} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <Link
            href={user ? "/profile" : "/login"}
            onClick={() => setOpen(false)}
          >
            {user ? "My profile" : "Sign in"}
          </Link>
        </div>
      )}
    </header>
  );
}
