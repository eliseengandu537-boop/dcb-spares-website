import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, MapPin, MessageCircle, Phone, ShieldCheck, Wrench } from "lucide-react";
import { branches, whatsapp } from "@/lib/data";
import { EnquiryButton } from "./enquiry";
import { Reveal } from "./motion";
import { ButtonLink, Eyebrow } from "./ui";
import { compatibilityStatement, distributorStatement } from "@/lib/business";
import { AssistantQuoteButton } from "./assistant-quote";

export function BrandStrip() {
  return <section className="brand-strip"><div className="container"><div className="brand-strip-intro"><span>AFTERMARKET PARTS<br />FOR THESE VEHICLE MAKES.</span><Link href="/brands/">Browse by vehicle make<ArrowUpRight size={14} /></Link></div><div className="brand-names" aria-label="Compatible vehicle makes"><span className="brand-toyota">TOYOTA</span><span className="brand-ford">Ford</span><span className="brand-benz">Mercedes-Benz</span><span className="brand-vw">Volkswagen</span><span className="brand-volvo">VOLVO</span></div></div><p className="container brand-compatibility-note">{compatibilityStatement}</p></section>;
}

export function AboutSection() {
  return <section className="section about-section" id="about"><div className="container about-layout"><Reveal><Eyebrow>MORE THAN A PARTS SUPPLIER</Eyebrow><h2>Good parts.<br />Real people.<br /><span>One less worry.</span></h2><p className="body-copy">From the workshop floor to the open road, the right component makes all the difference. We connect you with aftermarket auto-electrical parts and people who know them.</p><ButtonLink href="/about/" secondary>Get to know DCB</ButtonLink></Reveal><Reveal className="about-details" delay={0.15}><div className="importer-panel"><div className="gb-monogram">GB<span>PRODUCTS</span></div><div><span className="micro-label">YOUR GB CONNECTION</span><h3>Your primary<br />GB distributor.</h3><p>{distributorStatement}</p></div><ShieldCheck className="importer-shield" size={22} /></div><div className="reason-row"><Wrench size={23} /><div><h3>For your business. For your vehicle.</h3><p>Wholesale and retail supply for workshops, businesses and individual customers.</p></div></div><div className="reason-row"><MessageCircle size={23} /><div><h3>Let’s get the fit right.</h3><p>Share a part number, your vehicle details or a photo. Our team will help with your enquiry.</p></div></div><div className="reason-row"><MapPin size={23} /><div><h3>Two branches. One connection.</h3><p>Find our teams in Alrode, Gauteng and Stikland, Cape Town.</p></div></div></Reveal></div></section>;
}

export function HelpSection() {
  return <section className="section help-section"><div className="container"><Reveal className="help-panel"><div className="help-main"><Eyebrow>LET’S TAKE THE GUESSWORK OUT</Eyebrow><h2>Not sure which part?<br /><span>We speak auto-electrical.</span></h2><p>Tell DCB what you need a quote for.<br />Choose WhatsApp or submit a quote with DCB Assist.</p><div className="button-group"><a className="button button-primary" href={whatsapp()} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} />Chat on WhatsApp<ArrowUpRight size={15} /></a><AssistantQuoteButton /></div></div><ol className="help-steps"><li><span>01</span><div><h3>Tell us what you need.</h3><p>The item and quantity. Vehicle details are optional.</p></div></li><li><span>02</span><div><h3>Show us what you need.</h3><p>A part number or a clear photo helps.</p></div></li><li><span>03</span><div><h3>Let’s find your match.</h3><p>Confirm fit, availability and pricing with our team.</p></div></li></ol></Reveal></div></section>;
}

export function BranchCards() {
  return <div className="branch-grid">{branches.map((branch, index) => <Reveal key={branch.name} delay={index * 0.1}><article className="branch-card" id={branch.slug}><div className="branch-top"><span className="micro-label">{branch.region}</span><MapPin size={21} /></div><h3>{branch.city}<span>.</span></h3><p className="branch-name">{branch.name}</p><address>{branch.street}<br />{branch.area}<br />South Africa</address><div className="branch-links"><a href={`tel:${branch.tel}`}><Phone size={15} />{branch.phone}</a><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.map)}`} target="_blank" rel="noopener noreferrer">Directions<ArrowUpRight size={16} /></a></div></article></Reveal>)}</div>;
}

export function ContactSection() {
  return <section className="section contact-section"><div className="container"><Reveal className="section-heading"><div><Eyebrow>FIND YOUR LOCAL CONNECTION</Eyebrow><h2>Real people.<br /><span>Ready to help.</span></h2></div><ButtonLink href="/contact/" secondary>Get in touch</ButtonLink></Reveal><BranchCards /></div></section>;
}

export function TrustLine() {
  return <div className="trust-line"><span><Check size={14} />Wholesale & retail</span><span><Check size={14} />Specialist support</span><span><Check size={14} />Primary GB distributor</span></div>;
}

export function SmallCta() {
  return <div className="small-cta"><div><h3>Already have a part number?</h3><p>Send it to our team and let’s find your match.</p></div><EnquiryButton className="text-link">Ask our team</EnquiryButton><ArrowRight className="small-cta-decoration" size={80} aria-hidden="true" /></div>;
}
