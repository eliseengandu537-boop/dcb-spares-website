import { notFound } from "next/navigation";
import { vehicleBrands } from "@/lib/catalogue";
import { BrandPageContent } from "@/components/brand-page";
import { brandMetadata } from "@/lib/seo";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const brand=vehicleBrands.find(b=>b.original===slug);if(!brand)notFound();return brandMetadata(brand);}
export const dynamicParams=false;
export function generateStaticParams(){return vehicleBrands.map(b=>({slug:b.original}));}
export default async function OriginalBrandPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const brand=vehicleBrands.find(b=>b.original===slug);if(!brand)notFound();return <BrandPageContent brand={brand} />;}
