import type { MetadataRoute } from "next";
import { allowIndexing, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    ...(allowIndexing ? { sitemap: `${siteUrl}/sitemap.xml` } : {}),
  };
}
