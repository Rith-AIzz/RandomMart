"use client";

import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { useStore } from "../../components/store-provider";
import { formatMoney, productById } from "../../lib/products";

export default function OrdersPage() {
  const { orders, user } = useStore();
  if (!user) return <main><section className="auth-shell"><div className="auth-card" style={{textAlign:"center"}}><PackageOpen size={52} color="#f25a19" style={{margin:"0 auto"}} /><h1>Order history</h1><p>Sign in to see your own simulated orders.</p><Link href="/login?returnTo=/orders" className="button button-primary">Sign in</Link></div></section></main>;
  return <main><section className="page-hero"><div className="container"><div className="breadcrumbs"><Link href="/">Home</Link><Link href="/profile">Profile</Link><span>Orders</span></div><h1>Your orders</h1><p>Every order shown here belongs to this local demonstration session.</p></div></section><section className="section"><div className="container orders-list">{orders.length ? orders.map((order) => <article className="order-card" key={order.id}><div className="order-header"><div><p className="eyebrow">{new Date(order.createdAt).toLocaleDateString()}</p><h2 style={{margin:"7px 0"}}>{order.number}</h2><small>{order.address}</small></div><span className="status">{order.status}</span></div><div className="order-lines">{order.lines.map((line) => { const product = productById(line.productId); return product ? <div key={line.productId}><span>{product.name} × {line.quantity}</span><span>{formatMoney((product.discountCents ?? product.priceCents) * line.quantity)}</span></div> : null; })}</div><div className="order-header"><strong>Total: {formatMoney(order.totalCents)}</strong><Link href="/products" className="text-link">Buy something else</Link></div></article>) : <div className="empty-state"><PackageOpen size={42} /><h2>No orders yet</h2><p>Complete the simulated checkout and your order will appear here.</p><Link href="/products" className="button button-primary">Start shopping</Link></div>}</div></section></main>;
}
