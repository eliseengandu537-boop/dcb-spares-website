import type { Metadata } from "next";
import { Catalogue } from "@/components/catalogue";
import { PageHeading } from "@/components/ui";
import { HelpSection } from "@/components/sections";
import { productSummaries, vehicleBrands } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Our products", description: "Browse the complete DCB auto-electrical catalogue. Search original product photographs, part numbers, OE references and specifications." };

export default function ProductsPage() {
  return <><PageHeading eyebrow="THE COMPLETE DCB CATALOGUE" title="Every part." accent="A new possibility.">From complete units to the smallest connection. Explore {productSummaries.length.toLocaleString("en-GB")} parts across 16 ranges, with the details you need to find your match.</PageHeading><Catalogue items={productSummaries} brandOptions={vehicleBrands.map(({slug,name}) => ({slug,name}))} /><HelpSection /></>;
}
