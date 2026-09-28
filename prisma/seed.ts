import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { categories, products } from "../lib/products";

const connectionString = process.env.DIRECT_URL;
if (!connectionString)
  throw new Error("DIRECT_URL is required to seed RandomMart.");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const ids = new Map<string, string>();
  for (const category of categories) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
    });
    ids.set(category.slug, row.id);
  }
  for (const product of products) {
    const costCents =
      product.costCents ?? Math.round(product.priceCents * 0.55);
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        stockQuantity: product.stock,
        priceCents: product.priceCents,
        costCents,
        discountCents: product.discountCents,
      },
      create: {
        categoryId: ids.get(product.category)!,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        description: product.description,
        priceCents: product.priceCents,
        costCents,
        discountCents: product.discountCents,
        sku: product.sku,
        stockQuantity: product.stock,
        isActive: true,
        isFeatured: product.featured ?? false,
        images: {
          create: [
            {
              path: product.image,
              altText: product.name,
              mimeType: "image/png",
              sizeBytes: 1,
              sortOrder: 0,
            },
          ],
        },
      },
    });
  }
}
main().finally(() => prisma.$disconnect());
