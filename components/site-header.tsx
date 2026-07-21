"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useStore } from "./store-provider";

const links = [
  ["/products", "Shop"],
  ["/#categories", "Categories"],
  ["/#deals", "Deals"],
  ["/#about", "About"],
];

export function SiteHeader() {
  const { cartCount, user } = useStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/products?q=${encodeURIComponent(value)}` : "/products");
    setOpen(false);
  };

  return (
    <header className="site-header">
      <div className="demo-bar"><span>Portfolio demo</span> — checkout is simulated and no real payment details are collected.</div>
      <div className="header-main container">
        <Link href="/" className="wordmark" aria-label="RandomMart home">RandomMart</Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([href, label]) => <Link key={label} href={href} className={pathname === href ? "active" : ""}>{label}</Link>)}
        </nav>
        <form className="header-search" role="search" onSubmit={submitSearch}>
          <Search size={19} aria-hidden="true" />
          <label htmlFor="site-search" className="sr-only">Search products</label>
          <input id="site-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" />
        </form>
        <div className="header-actions">
          <Link href={user ? "/profile" : "/login"} className="header-action" aria-label={user ? `Account for ${user.name}` : "Sign in"}><UserRound aria-hidden="true" /><span>{user ? user.name.split(" ")[0] : "Account"}</span></Link>
          <Link href="/cart" className="header-action cart-link" aria-label={`Cart with ${cartCount} items`}><ShoppingBag aria-hidden="true" /><span>Cart</span>{cartCount > 0 && <b>{cartCount}</b>}</Link>
          <button type="button" className="mobile-menu-button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-nav"><span className="sr-only">Toggle menu</span>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && (
        <div id="mobile-nav" className="mobile-nav">
          <form className="mobile-search" role="search" onSubmit={submitSearch}><Search size={18} /><input aria-label="Search products" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" /></form>
          {links.map(([href, label]) => <Link key={label} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link href={user ? "/profile" : "/login"} onClick={() => setOpen(false)}>{user ? "My profile" : "Sign in"}</Link>
        </div>
      )}
    </header>
  );
}
