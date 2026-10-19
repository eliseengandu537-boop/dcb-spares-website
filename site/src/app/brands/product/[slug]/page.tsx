import { products } from "@/lib/catalogue";
export { default, generateMetadata } from "../../../product/[slug]/page";
export const dynamicParams=false;
export function generateStaticParams(){return products.filter(p=>p.brands.length>0).map(({slug})=>({slug}));}
