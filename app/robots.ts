import type { MetadataRoute } from "next";
import { getSiteUrl } from "../lib/runtime-config";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl().replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/checkout", "/profile", "/orders"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
