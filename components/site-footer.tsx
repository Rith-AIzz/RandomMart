import Link from "next/link";
import { ArrowUpRight, Camera, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer" id="about">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" className="wordmark wordmark-light">RandomMart</Link>
          <p>Useful things, unexpected finds, and a shopping experience designed to feel refreshingly simple.</p>
        </div>
        <div><h2>Explore</h2><Link href="/products">All products</Link><Link href="/#categories">Categories</Link><Link href="/#deals">Current deals</Link><Link href="/orders">Order history</Link></div>
        <div><h2>Customer care</h2><Link href="/profile">My account</Link><Link href="/cart">Shopping cart</Link><a href="mailto:hello@randommart.demo">Contact us</a><Link href="/admin">Admin demo</Link></div>
        <div><h2>Stay curious</h2><p>Monthly finds, practical ideas, and no clutter.</p><a className="footer-email" href="mailto:hello@randommart.demo"><Mail size={18} /> hello@randommart.demo</a><a className="footer-social" href="https://instagram.com" target="_blank" rel="noreferrer"><Camera size={18} /> Instagram <ArrowUpRight size={15} /></a></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} RandomMart</span><span>University portfolio project · Simulated commerce only</span></div>
    </footer>
  );
}
