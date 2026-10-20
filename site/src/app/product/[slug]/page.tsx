import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Check, FileText } from "lucide-react";
import { products, productBySlug, productSummaries, vehicleBrands, productAliases } from "@/lib/catalogue";
import { categories } from "@/lib/data";
import { ProductGallery } from "@/components/product-gallery";
import { PartCard } from "@/components/catalogue";
import { EnquiryButton } from "@/components/enquiry";
import { Eyebrow } from "@/components/ui";

export const dynamicParams = false;
export function generateStaticParams() {return [...products,...productAliases].map(({slug}) => ({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata> {
  const {slug}=await params;const p=productBySlug.get(slug);
  return {title:p ? `${p.code ? p.code+" · " : ""}${p.name}` : "Product",description:p ? `Aftermarket replacement: ${p.name}. Vehicle names and OE references identify compatibility.` : undefined,openGraph:p?.images[0]?{images:[{url:p.images[0],alt:p.name}]}:undefined};
}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;const product=productBySlug.get(slug);if(!product)notFound();
  const category=categories.find(c => product.categories.includes(c.slug));
  const matchingBrands=vehicleBrands.filter(b => product.brands.includes(b.slug));
  const related=productSummaries.filter(p => p.id!==product.id && p.categories.some(c=>product.categories.includes(c))).slice(0,4);
  return <><section className="container individual-product"><Link className="back-link" href={category ? `/products/${category.slug}/` : "/products/"}><ArrowLeft size={15} />{category?.name ?? "All products"}</Link><div className="individual-product-grid"><ProductGallery images={product.images} name={product.name} /><div className="individual-product-copy"><Eyebrow>{category?.group ?? "AUTO-ELECTRICAL"} / DCB SPARES</Eyebrow><span className="detail-part-code">{product.code || `DCB ${product.id}`}</span><h1>{product.name}</h1>{matchingBrands.length>0 && <div className="product-brand-links">{matchingBrands.map(b=><Link key={b.slug} href={`/brands/${b.slug}/`}>{b.name}</Link>)}</div>}<p className="compatibility-note">Aftermarket replacement. Vehicle names and OE references identify compatibility, not the manufacturer of this part. Confirm fitment with DCB before ordering.</p><div className="product-quote-panel"><p><Check size={16} />Let’s check the right fit.</p><span>Contact our team for current pricing, availability and compatibility with your vehicle.</span><EnquiryButton part={`${product.code ? product.code+" — " : ""}${product.name}`}>Enquire about this part</EnquiryButton></div>{product.description.length>0 && <div className="product-description">{product.description.map((p,i)=><p key={i}>{p}</p>)}</div>}<div className="product-service-note"><FileText size={18} /><p>Have your vehicle details and original part number ready. We’ll help confirm the match.</p></div></div></div>{product.specifications.length>0 && <section className="specification-section"><div><Eyebrow>THE DETAILS THAT MATTER</Eyebrow><h2>Product <span>specifications.</span></h2><p>Technical details from the DCB product catalogue.</p></div><dl className="specification-table">{product.specifications.map((s,i)=><div key={i}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl></section>}</section>{related.length>0 && <section className="section container related-parts"><Eyebrow>EXPLORE THE RANGE</Eyebrow><h2>More parts.<br /><span>More possibilities.</span></h2><div className="parts-grid">{related.map(p=><PartCard key={p.id} product={p} />)}</div></section>}</>;
}
