import { notFound } from "next/navigation";
import { categories } from "@/lib/data";
import { CategoryPageContent } from "@/components/category-page";
import { categoryMetadata } from "@/lib/seo";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const category=categories.find(c=>c.original===slug);if(!category)notFound();return categoryMetadata(category);}
export const dynamicParams=false;
export function generateStaticParams(){return categories.map(c=>({slug:c.original}));}
export default async function OriginalCategoryPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const category=categories.find(c=>c.original===slug);if(!category)notFound();return <CategoryPageContent category={category} />;}
