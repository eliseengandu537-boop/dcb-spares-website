import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { productSummaries, vehicleBrands } from "@/lib/catalogue";
import { Catalogue } from "./catalogue";
import { Eyebrow } from "./ui";
import { compatibilityStatement } from "@/lib/business";
export function BrandPageContent({brand}:{brand:typeof vehicleBrands[number]}) {
  const items=productSummaries.filter(p=>p.brands.includes(brand.slug));
  return <><section className="container brand-detail-heading"><Link href="/brands/" className="back-link"><ArrowLeft size={15} />All vehicle makes</Link><div><div><Eyebrow>AFTERMARKET PARTS COMPATIBLE WITH</Eyebrow><h1>{brand.name}<span>.</span></h1><p>{items.length} aftermarket auto-electrical parts listed for {brand.name} vehicle and equipment applications. Check part numbers and specifications with our team to confirm the fit.</p><p className="compatibility-note">{compatibilityStatement}</p></div><div className="brand-detail-logo"><Image src={`/images/original/${brand.slug}.webp`} alt={`${brand.name} compatibility reference`} width={240} height={200} /></div></div></section><Catalogue items={items} brand={brand.slug} /></>;
}
