import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { type Category } from "@/lib/data";

export function CategoryArt({ category, priority = false }: { category: Category; priority?: boolean }) {
  return <Image src={`/images/original/${category.slug}.webp`} alt={`DCB ${category.name.toLowerCase()}`} width={900} height={700} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw" />;
}

export function ProductCard({ category, index = 0 }: { category: Category; index?: number }) {
  return <Link className={`product-card ${category.image ? "has-image" : ""}`} href={`/products/${category.slug}/`}><div className="product-card-top"><span>{category.group}</span><span>{String(index + 1).padStart(2, "0")}</span></div><div className="product-card-art"><CategoryArt category={category} /></div><div className="product-card-bottom"><div><h3>{category.name}</h3><p>{category.description}</p></div><span className="round-arrow"><ArrowUpRight size={19} /></span></div></Link>;
}
