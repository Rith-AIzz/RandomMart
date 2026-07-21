import Link from "next/link";
import { SearchX } from "lucide-react";
export default function NotFound(){return <main><section className="auth-shell"><div className="auth-card" style={{textAlign:"center"}}><SearchX size={52} color="#f25a19" style={{margin:"0 auto"}} /><p className="eyebrow">404</p><h1>That find wandered off.</h1><p>The page may have moved, or the product is no longer available.</p><Link href="/products" className="button button-primary">Browse the shop</Link></div></section></main>}
