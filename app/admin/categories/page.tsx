import { AdminCategoryManager } from "../../../components/admin-category-manager";
import { AdminShell } from "../../../components/admin-shell";
import { prisma } from "../../../lib/prisma/client";
import { isLiveMode } from "../../../lib/runtime-config";
import {
  categories as sampleCategories,
  products as sampleProducts,
} from "../../../lib/products";
import { requirePermission } from "../../../services/authorization.service";

export default async function CategoriesPage() {
  const liveMode = isLiveMode();
  if (liveMode) await requirePermission("catalog.manage");
  const rows = liveMode
    ? await prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      })
    : [];
  const categories = liveMode
    ? rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description ?? "",
        count: row._count.products,
        active: row.isActive,
      }))
    : sampleCategories.map((row) => ({
        id: row.slug,
        name: row.name,
        slug: row.slug,
        description: row.description,
        count: sampleProducts.filter((product) => product.category === row.slug)
          .length,
        active: true,
      }));
  return (
    <AdminShell>
      <AdminCategoryManager categories={categories} liveMode={liveMode} />
    </AdminShell>
  );
}
