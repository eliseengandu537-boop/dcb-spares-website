import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { vehicleBrands } from "@/lib/catalogue";
import { HelpSection } from "@/components/sections";
import { PageHeading } from "@/components/ui";
export const metadata:Metadata={title:"Vehicle brands",description:"Browse DCB parts for 12 vehicle and equipment makes, from Toyota and Ford to John Deere and Cummins."};
export default function BrandsPage(){return <><PageHeading eyebrow="FIND YOUR CONNECTION" title="Different badges." accent="One place to start.">Passenger cars, commercial vehicles and equipment. Explore the original DCB ranges for your make, model and engine.</PageHeading><section className="container brands-section"><div className="brands-grid">{vehicleBrands.map((brand,index)=><Link className="brand-tile original-brand-tile" key={brand.slug} href={`/brands/${brand.slug}/`}><span className="micro-label">{String(index+1).padStart(2,"0")} / VEHICLE & EQUIPMENT</span><div className="brand-logo-panel"><Image src={`/images/original/${brand.slug}.webp`} alt={brand.name+" logo"} width={260} height={160} /></div><h2>{brand.name}</h2><span className="text-link">Explore {brand.expected} products<ArrowUpRight size={15} /></span></Link>)}</div><p className="image-caption">Vehicle brand names identify applications in the DCB catalogue. Confirm compatibility with our team.</p></section><HelpSection /></>;}
