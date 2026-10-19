import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { categories, type Category } from "@/lib/data";
import { productSummaries, vehicleBrands } from "@/lib/catalogue";
import { CategoryArt, ProductCard } from "./products";
import { Catalogue } from "./catalogue";
import { Eyebrow } from "./ui";
import { EnquiryButton } from "./enquiry";

export function CategoryPageContent({ category }: { category: Category }) {
  const related=categories.filter(c=>c.group===category.group && c.slug!==category.slug).slice(0,3);
  const items=productSummaries.filter(p=>p.categories.includes(category.slug));
  return <><section className="container category-detail"><Link href="/products/?view=ranges" className="back-link"><ArrowLeft size={15} />All product ranges</Link><div className="category-detail-grid"><div className="category-detail-image"><CategoryArt category={category} priority /><span>{category.group} / DCB SPARES</span></div><div className="category-detail-copy"><Eyebrow>{category.group} SYSTEMS</Eyebrow><h1>{category.name}<span>.</span></h1><h2>{category.description}</h2><p>{category.detail}</p><div className="button-group"><a className="button button-primary" href="#product-list">Explore {items.length} products</a><EnquiryButton part={category.name} className="button button-secondary">Enquire about this range</EnquiryButton></div><div className="match-panel"><h3>For a faster match, have these ready.</h3><ul>{category.match.map(item=><li key={item}><Check size={15} />{item}</li>)}</ul></div></div></div></section><Catalogue items={items} category={category.slug} brandOptions={vehicleBrands.map(({slug,name})=>({slug,name}))} />{related.length>0 && <section className="section related-section"><div className="container"><Eyebrow>KEEP THE CONNECTION GOING</Eyebrow><h2>Related <span>ranges.</span></h2><div className="featured-grid">{related.map((item,index)=><ProductCard key={item.slug} category={item} index={index} />)}</div></div></section>}</>;
}
