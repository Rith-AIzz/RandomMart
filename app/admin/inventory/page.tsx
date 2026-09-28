import { AdminInventoryManager } from "../../../components/admin-inventory-manager";
import { AdminShell } from "../../../components/admin-shell";
import { prisma } from "../../../lib/prisma/client";
import { isLiveMode } from "../../../lib/runtime-config";
import {
  categoryName,
  products as sampleProducts,
} from "../../../lib/products";
import { requirePermission } from "../../../services/authorization.service";

export default async function InventoryPage() {
  const liveMode = isLiveMode();
  if (liveMode) await requirePermission("catalog.manage");
  const rows = liveMode
    ? await prisma.product.findMany({
        include: { category: true },
        orderBy: { stockQuantity: "asc" },
      })
    : [];
  const products = liveMode
    ? rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category.name,
        sku: row.sku,
        stock: row.stockQuantity,
      }))
    : [...sampleProducts]
        .sort((a, b) => a.stock - b.stock)
        .map((row) => ({
          id: row.id,
          name: row.name,
          category: categoryName(row.category),
          sku: row.sku,
          stock: row.stock,
        }));
  return (
    <AdminShell>
      <AdminInventoryManager products={products} liveMode={liveMode} />
    </AdminShell>
  );
}
