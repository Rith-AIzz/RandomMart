import Link from "next/link";
import { Boxes, FolderTree, Gauge, PackageSearch, ShoppingCart, UsersRound, Warehouse } from "lucide-react";

const links = [[Gauge,"Dashboard","/admin"],[Boxes,"Products","/admin/products"],[FolderTree,"Categories","/admin/categories"],[ShoppingCart,"Orders","/admin/orders"],[UsersRound,"Customers","/admin/customers"],[Warehouse,"Inventory","/admin/inventory"]] as const;

export function AdminShell({ children }: { children: React.ReactNode }) { return <main className="admin-shell"><div className="admin-layout"><aside className="admin-sidebar"><Link className="wordmark" href="/">RandomMart</Link><nav aria-label="Administrator navigation">{links.map(([Icon,label,href]) => <Link href={href} key={href}><Icon size={17} />{label}</Link>)}</nav><Link href="/products" style={{display:"flex",gap:8,alignItems:"center",marginTop:35,color:"#ff9a6d",fontSize:12}}><PackageSearch size={16} /> Return to store</Link></aside><section className="admin-main">{children}</section></div></main>; }
