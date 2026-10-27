import type { Metadata } from "next";
import { Catalogue } from "@/components/catalogue";
import { PageHeading } from "@/components/ui";
import { HelpSection } from "@/components/sections";
import { productSummaries, vehicleBrands } from "@/lib/catalogue";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Auto-Electrical Parts Catalogue", description: "Browse DCB's aftermarket alternators, starter motors, LED lights and electrical spares. Search part numbers, photographs and specifications, and request a quote.", path: "/products/" });

export default function ProductsPage() {
  return <><PageHeading eyebrow="THE COMPLETE DCB CATALOGUE" title="Every part." accent="A new possibility.">From complete units to the smallest connection. Explore {productSummaries.length.toLocaleString("en-GB")} parts across 16 ranges, with the details you need to find your match.</PageHeading><Catalogue items={productSummaries} brandOptions={vehicleBrands.map(({slug,name}) => ({slug,name}))} /><HelpSection /></>;
}
