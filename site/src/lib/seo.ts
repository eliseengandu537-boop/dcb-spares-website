import type { Metadata } from "next";
import type { Category } from "./data";
import type { Product } from "./catalogue";

export const siteUrl = "https://www.dcbspares.co.za";
export const siteName = "DCB Spares";
export const siteDescription = "DCB Spares is the primary distributor of GB products. Browse aftermarket alternators, starters and electrical spares in Alrode and Cape Town.";
export const allowIndexing = process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV !== "development";
export const absoluteUrl = (path: string) => new URL(path, `${siteUrl}/`).href;

export function pageMetadata({ title, description, path, image = "/images/dcb-social-preview.png", imageAlt = "DCB Spares — aftermarket auto-electrical spares and primary GB distributor" }: {
  title: string; description: string; path: string; image?: string; imageAlt?: string;
}): Metadata {
  const url = absoluteUrl(path);
  const shareTitle = `${title} | ${siteName}`;
  const images = [{ url: absoluteUrl(image), alt: imageAlt }];
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title: shareTitle, description, url, siteName, type: "website", locale: "en_ZA", images },
    twitter: { card: "summary_large_image", title: shareTitle, description, images },
  };
}

export const homeMetadata = pageMetadata({ title: "Auto-Electrical Spares & GB Distributor", description: siteDescription, path: "/" });

export function categoryMetadata(category: Category) {
  return pageMetadata({
    title: `${category.name} & Replacement Parts`,
    description: `Browse aftermarket ${category.name.toLowerCase()} from DCB Spares. Check part numbers, photographs and specifications, then request a quote from our team.`,
    path: `/products/${category.slug}/`, image: `/images/original/${category.slug}.webp`, imageAlt: `DCB ${category.name.toLowerCase()}`,
  });
}

export function brandMetadata(brand: { slug: string; name: string }) {
  return pageMetadata({
    title: `Aftermarket Parts Compatible with ${brand.name}`,
    description: `Find aftermarket auto-electrical spares compatible with ${brand.name} vehicles and equipment. Browse part numbers and specifications, then request a DCB quote.`,
    path: `/brands/${brand.slug}/`,
  });
}

export function productMetadata(product: Product) {
  const code = product.code || `DCB ${product.id}`;
  return pageMetadata({
    title: `${code} – ${product.name}`,
    description: `Enquire about ${code}: ${product.name}. Aftermarket replacement; confirm pricing, availability and fitment with DCB Spares.`,
    path: `/product/${product.slug}/`, image: product.images[0], imageAlt: product.name,
  });
}

export type Breadcrumb = { name: string; path: string };
export function breadcrumbData(items: Breadcrumb[]) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })),
  };
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
