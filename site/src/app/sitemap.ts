import type { MetadataRoute } from "next";
import { categories } from "@/lib/data";
import { products, vehicleBrands } from "@/lib/catalogue";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only preferred URLs belong here. Legacy aliases declare these same
  // canonicals. No fabricated modification dates, prices or stock information.
  const pages = ["/", "/about/", "/contact/", "/products/", "/brands/", "/company-profile/", "/privacy-policy/"];
  return [
    ...pages.map(path => ({ url: absoluteUrl(path) })),
    ...categories.map(category => ({ url: absoluteUrl(`/products/${category.slug}/`) })),
    ...vehicleBrands.map(brand => ({ url: absoluteUrl(`/brands/${brand.slug}/`) })),
    ...products.map(product => ({ url: absoluteUrl(`/product/${product.slug}/`), images: product.images.map(absoluteUrl) })),
  ];
}
