import { AdminProductManager } from "../../../components/admin-product-manager";
import { AdminShell } from "../../../components/admin-shell";
import { prisma } from "../../../lib/prisma/client";
import { isLiveMode } from "../../../lib/runtime-config";
import {
  categories as sampleCategories,
  products as sampleProducts,
} from "../../../lib/products";
import { requirePermission } from "../../../services/authorization.service";

export default async function AdminProductsPage() {
  const liveMode = isLiveMode();
  if (liveMode) await requirePermission("catalog.manage");
  const rows = liveMode
    ? await prisma.product.findMany({
        include: { category: true },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const categoryRows = liveMode
    ? await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      })
    : [];
  const products = liveMode
    ? rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        sku: row.sku,
        category: row.category.name,
        priceCents: row.discountCents ?? row.priceCents,
        costCents: row.costCents,
        stock: row.stockQuantity,
        active: row.isActive,
      }))
    : sampleProducts.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        sku: row.sku,
        category:
          sampleCategories.find((category) => category.slug === row.category)
            ?.name ?? row.category,
        priceCents: row.discountCents ?? row.priceCents,
        costCents: row.costCents ?? Math.round(row.priceCents * 0.55),
        stock: row.stock,
        active: true,
      }));
  const categories = liveMode
    ? categoryRows.map(({ id, name }) => ({ id, name }))
    : sampleCategories.map(({ slug, name }) => ({ id: slug, name }));
  return (
    <AdminShell>
      <AdminProductManager
        products={products}
        categories={categories}
        liveMode={liveMode}
      />
    </AdminShell>
  );
}
