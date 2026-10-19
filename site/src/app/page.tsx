import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Search, ShieldCheck } from "lucide-react";
import { categories } from "@/lib/data";
import { Atmosphere, HeroMotion, Reveal } from "@/components/motion";
import { ButtonLink, Eyebrow } from "@/components/ui";
import { EnquiryButton } from "@/components/enquiry";
import { ProductCard } from "@/components/products";
import { AboutSection, BrandStrip, ContactSection, HelpSection, TrustLine } from "@/components/sections";

export default function Home() {
  return <>
    <section className="hero"><Atmosphere /><HeroMotion><Image src="/images/original/hero-alternator.webp" alt="Original DCB GB alternator" width={1000} height={1000} loading="eager" fetchPriority="high" sizes="(max-width: 760px) 100vw, 55vw" /></HeroMotion><div className="hero-shade" /><div className="container hero-content"><div className="hero-copy"><Eyebrow>PRECISION PARTS. REAL PEOPLE.</Eyebrow><h1>Power<br />every <span>journey.</span></h1><p>From the first spark to the road ahead.<br />Your connection to quality auto-electrical spares.</p><div className="button-group"><ButtonLink href="/products/">Explore our parts</ButtonLink><EnquiryButton className="button button-ghost">Find my part</EnquiryButton></div><TrustLine /></div><div className="hero-product-note"><span className="product-marker" /><div><span>ENGINEERED TO KEEP YOU MOVING</span><Link href="/products/alternators/">Explore alternators<ArrowUpRight size={15} /></Link></div></div><div className="hero-bottom"><a href="#range"><ArrowDown size={15} /><span>SCROLL TO EXPLORE</span></a><span>AUTO-ELECTRICAL. ALL THE WAY.</span><span className="hero-counter"><b>01</b> / THE POWER TO MOVE</span></div></div></section>
    <section className="finder-bar"><div className="container finder-content"><div><Search size={22} /><p>Every job starts with<br /><strong>the right part.</strong></p></div><form action="/products/" method="get" role="search"><label className="sr-only" htmlFor="home-search">Search products</label><input id="home-search" name="q" placeholder="What are you looking for?" autoComplete="off" /><button type="submit" aria-label="Search products"><ArrowRight size={21} /></button></form><span className="finder-help">Not sure? <EnquiryButton className="text-link">Ask our team</EnquiryButton></span></div></section>
    <section className="section range-section" id="range"><div className="container"><Reveal className="section-heading"><div><Eyebrow>THE DCB RANGE</Eyebrow><h2>Built to perform.<br /><span>Ready for your next move.</span></h2></div><ButtonLink href="/products/" secondary>View all products</ButtonLink></Reveal><div className="featured-grid">{categories.slice(0, 3).map((category, index) => <Reveal key={category.slug} delay={index * 0.1}><ProductCard category={category} index={index} /></Reveal>)}</div><Reveal className="range-footer"><span>THE BIG PARTS. THE SMALL DETAILS. <b>ALL THE CONNECTIONS.</b></span><Link href="/products/?view=ranges">Explore all 16 product ranges<ArrowRight size={16} /></Link></Reveal><p className="image-caption">Original DCB products. Specialist advice for the right fit.</p></div></section>
    <BrandStrip /><AboutSection />
    <section className="statement-section"><div className="container"><Reveal><span className="micro-label">FOR EVERY WORKSHOP. EVERY REPAIR. EVERY JOURNEY.</span><h2>Behind every reliable drive,<br />there’s <span>the right connection.</span></h2><p><ShieldCheck size={18} />Auto-electrical specialists. Wholesale & retail.</p></Reveal></div><span className="statement-dcb" aria-hidden="true">DCB</span></section>
    <HelpSection /><ContactSection />
  </>;
}
