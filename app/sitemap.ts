import type { MetadataRoute } from "next";
import { getCatalogProducts } from "../lib/catalog";
import { getSiteUrl } from "../lib/runtime-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl().replace(/\/$/, "");
  const products = await getCatalogProducts();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
    ...products.map((product) => ({
      url: `${base}/products/${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
