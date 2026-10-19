import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categories } from "@/lib/data";
import { CategoryPageContent } from "@/components/category-page";
export const dynamicParams=false;
export function generateStaticParams(){return categories.map(c=>({slug:c.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const category=categories.find(c=>c.slug===slug);return {title:category?.name,description:category?.detail};}
export default async function CategoryPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const category=categories.find(c=>c.slug===slug);if(!category)notFound();return <CategoryPageContent category={category} />;}
