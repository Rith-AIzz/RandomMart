"use client";

import Link from "next/link";
import { MapPin, Package, UserRound } from "lucide-react";
import { useStore } from "../../components/store-provider";

export default function ProfilePage() {
  const { user, orders, signOut } = useStore();
  if (!user) return <main><section className="auth-shell"><div className="auth-card" style={{textAlign:"center"}}><UserRound size={52} color="#f25a19" style={{margin:"0 auto"}} /><h1>Your account</h1><p>Sign in to manage profile details, addresses, and order history.</p><Link href="/login" className="button button-primary">Sign in</Link></div></section></main>;
  return <main><section className="page-hero"><div className="container"><div className="breadcrumbs"><Link href="/">Home</Link><span>Profile</span></div><h1>Hello, {user.name.split(" ")[0]}.</h1><p>Manage your local demo profile and review recent shopping activity.</p></div></section><section className="section"><div className="container two-column"><div className="profile-grid"><div className="profile-card"><div className="profile-header"><div style={{display:"flex",gap:16,alignItems:"center"}}><div className="profile-avatar">{user.name.charAt(0)}</div><div><p className="eyebrow">Customer profile</p><h2 style={{margin:"5px 0"}}>{user.name}</h2><small>{user.email}</small></div></div><button className="button button-outline" type="button" onClick={signOut}>Sign out</button></div></div><div className="profile-card"><p className="eyebrow">Default shipping address</p><h2><MapPin size={19} /> Riverside Home</h2><p>123 Riverside Avenue<br />Phnom Penh, Cambodia</p><button className="button button-outline" type="button">Edit address</button></div></div><aside className="summary-card"><h2>Account snapshot</h2><div className="summary-lines"><div><span>Demo orders</span><span>{orders.length}</span></div><div><span>Saved addresses</span><span>1</span></div><div><span>Role</span><span>Customer</span></div></div><Link href="/orders" className="button button-light"><Package size={18} /> View orders</Link></aside></div></section></main>;
}
