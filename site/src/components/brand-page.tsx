import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { productSummaries, vehicleBrands } from "@/lib/catalogue";
import { Catalogue } from "./catalogue";
import { Eyebrow } from "./ui";
export function BrandPageContent({brand}:{brand:typeof vehicleBrands[number]}) {
  const items=productSummaries.filter(p=>p.brands.includes(brand.slug));
  return <><section className="container brand-detail-heading"><Link href="/brands/" className="back-link"><ArrowLeft size={15} />All vehicle brands</Link><div><div><Eyebrow>YOUR VEHICLE. YOUR CONNECTION.</Eyebrow><h1>{brand.name}<span>.</span></h1><p>{items.length} auto-electrical parts in the DCB {brand.name} range. Explore photographs, part numbers and specifications to find your next match.</p></div><div className="brand-detail-logo"><Image src={`/images/original/${brand.slug}.webp`} alt={`${brand.name} logo`} width={240} height={200} /></div></div></section><Catalogue items={items} brand={brand.slug} /></>;
}
