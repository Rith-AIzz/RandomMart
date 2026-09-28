"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Mail } from "lucide-react";

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="site-footer" id="about">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" className="wordmark wordmark-light">
            RandomMart
          </Link>
          <p>
            Useful things, unexpected finds, and a shopping experience designed
            to feel refreshingly simple.
          </p>
        </div>
        <div>
          <h2>Explore</h2>
          <Link href="/products">All products</Link>
          <Link href="/#categories">Categories</Link>
          <Link href="/#deals">Current deals</Link>
          <Link href="/orders">Order history</Link>
        </div>
        <div>
          <h2>Customer care</h2>
          <Link href="/profile">My account</Link>
          <Link href="/cart">Shopping cart</Link>
          <Link href="/shipping">Shipping policy</Link>
          <Link href="/returns">Returns & refunds</Link>
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/terms">Terms of service</Link>
        </div>
        <div>
          <h2>Stay curious</h2>
          <p>Monthly finds, practical ideas, and no clutter.</p>
          <a className="footer-email" href="mailto:hello@randommart.example">
            <Mail size={16} /> hello@randommart.example
          </a>
          <a
            className="footer-social"
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
          >
            Instagram <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} RandomMart. All rights reserved.</span>
        <span>Made with care for everyday discovery.</span>
      </div>
    </footer>
  );
}
