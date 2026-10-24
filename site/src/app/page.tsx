import Link from "next/link";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import { categories } from "@/lib/data";
import { Reveal } from "@/components/motion";
import { ButtonLink, Eyebrow } from "@/components/ui";
import { EnquiryButton } from "@/components/enquiry";
import { ExplodedAlternator } from "@/components/exploded-alternator";
import { ProductCard } from "@/components/products";
import { AboutSection, BrandStrip, ContactSection, HelpSection } from "@/components/sections";

export default function Home() {
  return <>
    <ExplodedAlternator />
    <section className="finder-bar"><div className="container finder-content"><div><Search size={22} /><p>Every job starts with<br /><strong>the right part.</strong></p></div><form action="/products/" method="get" role="search"><label className="sr-only" htmlFor="home-search">Search products</label><input id="home-search" name="q" placeholder="Part number, vehicle or part name…" autoComplete="off" /><button type="submit" aria-label="Search products"><ArrowRight size={21} /></button></form><span className="finder-help">Not sure? <EnquiryButton className="text-link">Ask our team</EnquiryButton></span></div></section>
    <section className="section range-section" id="range"><div className="container"><Reveal className="section-heading"><div><Eyebrow>THE DCB RANGE</Eyebrow><h2>Built to perform.<br /><span>Ready for your next move.</span></h2></div><ButtonLink href="/products/" secondary>View all products</ButtonLink></Reveal><div className="featured-grid">{categories.slice(0, 3).map((category, index) => <Reveal key={category.slug} delay={index * 0.1}><ProductCard category={category} index={index} /></Reveal>)}</div><Reveal className="range-footer"><span>THE BIG PARTS. THE SMALL DETAILS. <b>ALL THE CONNECTIONS.</b></span><Link href="/products/?view=ranges">Explore all 16 product ranges<ArrowRight size={16} /></Link></Reveal><p className="image-caption">Original DCB products. Specialist advice for the right fit.</p></div></section>
    <BrandStrip /><AboutSection />
    <section className="statement-section"><div className="container"><Reveal><span className="micro-label">FOR EVERY WORKSHOP. EVERY REPAIR. EVERY JOURNEY.</span><h2>Behind every reliable drive,<br />there’s <span>the right connection.</span></h2><p><ShieldCheck size={18} />Auto-electrical specialists. Wholesale & retail.</p></Reveal></div><span className="statement-dcb" aria-hidden="true">DCB</span></section>
    <HelpSection /><ContactSection />
  </>;
}
