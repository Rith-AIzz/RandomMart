import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminShell } from "../../../components/admin-shell";
import { categoryName, formatMoney, products } from "../../../lib/products";

export default function AdminProductsPage() { return <AdminShell><div className="admin-title"><div><p className="eyebrow">Catalog management</p><h1>Products</h1></div><button className="button button-primary" type="button"><Plus size={17} /> New product</button></div><div className="admin-card"><div className="table-scroll"><table className="data-table"><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><Link href={`/products/${product.slug}`}><b>{product.name}</b></Link></td><td>{product.sku}</td><td>{categoryName(product.category)}</td><td>{formatMoney(product.discountCents ?? product.priceCents)}</td><td>{product.stock}</td><td><span className="status">{product.stock ? "Active" : "Out"}</span></td></tr>)}</tbody></table></div></div></AdminShell>; }
