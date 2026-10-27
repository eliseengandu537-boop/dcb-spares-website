import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { vehicleBrands } from "@/lib/catalogue";
import { HelpSection } from "@/components/sections";
import { PageHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
export const metadata:Metadata=pageMetadata({title:"Aftermarket Parts by Vehicle Make",description:"Browse aftermarket auto-electrical parts compatible with 12 vehicle and equipment makes. Vehicle names identify fitment only.",path:"/brands/"});
export default function BrandsPage(){return <><PageHeading eyebrow="FIND YOUR CONNECTION" title="Different badges." accent="One place to start.">Aftermarket equivalents for passenger cars, commercial vehicles and equipment. Browse by vehicle make, then confirm compatibility with DCB.</PageHeading><section className="container brands-section"><div className="brands-grid">{vehicleBrands.map((brand,index)=><Link className="brand-tile original-brand-tile" key={brand.slug} href={`/brands/${brand.slug}/`}><span className="micro-label">{String(index+1).padStart(2,"0")} / AFTERMARKET FITMENT</span><div className="brand-logo-panel"><Image src={`/images/original/${brand.slug}.webp`} alt={brand.name+" logo"} width={260} height={160} /></div><h2>{brand.name}</h2><span className="text-link">Explore {brand.expected} products<ArrowUpRight size={15} /></span></Link>)}</div><p className="image-caption">DCB supplies aftermarket equivalents that fit these vehicles. We do not manufacture or distribute these vehicle makers’ branded parts. Names and logos identify compatibility only.</p></section><HelpSection /></>;}
