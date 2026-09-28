import { isDatabaseConfigured } from "./runtime-config";
import {
  categories as sampleCategories,
  products as sampleProducts,
  type Product,
} from "./products";
import type { Prisma } from "../generated/prisma/client";

export type StoreCategory = {
  slug: string;
  name: string;
  description: string;
  icon: (typeof sampleCategories)[number]["icon"];
};

import { cache } from "react";

export const getCatalogProducts = cache(async function getCatalogProducts(): Promise<Product[]> {
  if (!isDatabaseConfigured()) return sampleProducts;
  const { prisma } = await import("./prisma/client");
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      reviews: { where: { isApproved: true }, select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    category: row.category.slug,
    shortDescription: row.shortDescription,
    description: row.description,
    priceCents: row.priceCents,
    discountCents: row.discountCents ?? undefined,
    stock: row.stockQuantity,
    featured: row.isFeatured,
    rating: row.reviews.length
      ? row.reviews.reduce((sum, review) => sum + review.rating, 0) /
        row.reviews.length
      : 0,
    reviewCount: row.reviews.length,
    image: row.images[0]?.path ?? "/images/product-placeholder.svg",
    imagePosition: "50% 50%",
  }));
});

export async function getCatalogCategories(): Promise<StoreCategory[]> {
  if (!isDatabaseConfigured())
    return sampleCategories.map((category) => ({ ...category }));
  const { prisma } = await import("./prisma/client");
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    description: row.description ?? "Explore this collection.",
    icon: "Sparkles",
  }));
}

export async function getCatalogProductBySlug(slug: string): Promise<Product | undefined> {
  if (!isDatabaseConfigured()) {
    return sampleProducts.find((p) => p.slug === slug);
  }
  const { prisma } = await import("./prisma/client");
  const row = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      reviews: { where: { isApproved: true }, select: { rating: true } },
    },
  });
  if (!row) return undefined;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    category: row.category.slug,
    shortDescription: row.shortDescription,
    description: row.description,
    priceCents: row.priceCents,
    discountCents: row.discountCents ?? undefined,
    stock: row.stockQuantity,
    featured: row.isFeatured,
    rating: row.reviews.length
      ? row.reviews.reduce((sum, review) => sum + review.rating, 0) /
        row.reviews.length
      : 0,
    reviewCount: row.reviews.length,
    image: row.images[0]?.path ?? "/images/product-placeholder.svg",
    imagePosition: "50% 50%",
  };
}

export type CatalogQuery = {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  sort?: string;
  featured?: string;
  page?: string;
};

export async function getCatalogPage(params: CatalogQuery, pageSize = 12) {
  if (isDatabaseConfigured()) {
    const { prisma } = await import("./prisma/client");
    const q = params.q?.trim();
    const min = Math.max(0, Number(params.min || 0) * 100);
    const max = Math.max(
      min,
      Number(params.max || Number.MAX_SAFE_INTEGER) * 100,
    );
    const conditions: Prisma.ProductWhereInput[] = [
      { isActive: true },
      ...(params.category ? [{ category: { slug: params.category } }] : []),
      ...(params.featured ? [{ isFeatured: true }] : []),
      ...(q
        ? [
            {
              OR: ["name", "sku", "shortDescription", "description"].map(
                (field) => ({ [field]: { contains: q, mode: "insensitive" } }),
              ),
            } as Prisma.ProductWhereInput,
          ]
        : []),
      {
        OR: [
          { discountCents: { not: null, gte: min, lte: max } },
          { discountCents: null, priceCents: { gte: min, lte: max } },
        ],
      },
    ];
    const where: Prisma.ProductWhereInput = { AND: conditions };
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      params.sort === "name"
        ? { name: "asc" }
        : params.sort === "price-low"
          ? { priceCents: "asc" }
          : params.sort === "price-high"
            ? { priceCents: "desc" }
            : { createdAt: "desc" };
    const total = await prisma.product.count({ where });
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(
      Math.max(Number.parseInt(params.page ?? "1", 10) || 1, 1),
      pageCount,
    );
    const rows = await prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        reviews: { where: { isApproved: true }, select: { rating: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const products = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      sku: row.sku,
      category: row.category.slug,
      shortDescription: row.shortDescription,
      description: row.description,
      priceCents: row.priceCents,
      discountCents: row.discountCents ?? undefined,
      stock: row.stockQuantity,
      featured: row.isFeatured,
      rating: row.reviews.length
        ? row.reviews.reduce((sum, review) => sum + review.rating, 0) /
          row.reviews.length
        : 0,
      reviewCount: row.reviews.length,
      image: row.images[0]?.path ?? "/images/product-placeholder.svg",
      imagePosition: "50% 50%",
    }));
    return { products, total, page, pageCount };
  }
  const all = await getCatalogProducts();
  const q = params.q?.trim().toLowerCase() ?? "";
  const min = Number(params.min || 0) * 100;
  const max = Number(params.max || Number.MAX_SAFE_INTEGER) * 100;
  const filtered = all.filter((product) => {
    const haystack =
      `${product.name} ${product.sku} ${product.shortDescription} ${product.description}`.toLowerCase();
    return (
      (!q || haystack.includes(q)) &&
      (!params.category || product.category === params.category) &&
      (product.discountCents ?? product.priceCents) >= min &&
      (product.discountCents ?? product.priceCents) <= max &&
      (!params.featured || product.featured)
    );
  });
  const sorted = [...filtered].sort((a, b) =>
    params.sort === "price-low"
      ? (a.discountCents ?? a.priceCents) - (b.discountCents ?? b.priceCents)
      : params.sort === "price-high"
        ? (b.discountCents ?? b.priceCents) - (a.discountCents ?? a.priceCents)
        : params.sort === "name"
          ? a.name.localeCompare(b.name)
          : b.id.localeCompare(a.id),
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(
    Math.max(Number.parseInt(params.page ?? "1", 10) || 1, 1),
    pageCount,
  );
  return {
    products: sorted.slice((page - 1) * pageSize, page * pageSize),
    total: sorted.length,
    page,
    pageCount,
  };
}

export async function getApprovedReviews(productId: string) {
  if (!isDatabaseConfigured()) return [];
  const { prisma } = await import("./prisma/client");
  return prisma.review.findMany({
    where: { productId, isApproved: true },
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      createdAt: true,
      profile: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
