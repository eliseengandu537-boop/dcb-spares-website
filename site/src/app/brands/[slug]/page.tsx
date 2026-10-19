import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { vehicleBrands } from "@/lib/catalogue";
import { BrandPageContent } from "@/components/brand-page";
export const dynamicParams=false;
export function generateStaticParams(){return vehicleBrands.map(b=>({slug:b.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;return {title:`${vehicleBrands.find(b=>b.slug===slug)?.name ?? "Vehicle"} parts`};}
export default async function BrandPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const brand=vehicleBrands.find(b=>b.slug===slug);if(!brand)notFound();return <BrandPageContent brand={brand} />;}
