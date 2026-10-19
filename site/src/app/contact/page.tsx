import type { Metadata } from "next";
import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import { PageHeading, Eyebrow } from "@/components/ui";
import { BranchCards } from "@/components/sections";
import { EnquiryForm } from "@/components/enquiry";
import { whatsapp } from "@/lib/data";

export const metadata: Metadata = { title: "Contact us", description: "Contact DCB Spares in Alrode on 011 908 6366 or DCB Auto Cape on 021 286 2737. WhatsApp 064 680 5363 for parts enquiries." };

export default function ContactPage() {
  return <><PageHeading eyebrow="LET’S TALK PARTS" title="A real connection." accent="A better next step.">Need a part, a price, or a little guidance? Reach out to our team or visit your nearest DCB branch.</PageHeading><section className="container contact-page-branches"><BranchCards /><div className="contact-direct"><a href="mailto:info@dcbspares.co.za"><Mail size={22} /><div><span>EMAIL OUR TEAM</span><strong>info@dcbspares.co.za</strong></div><ArrowUpRight size={20} /></a><a href={whatsapp()} target="_blank" rel="noopener noreferrer"><MessageCircle size={22} /><div><span>CHAT ON WHATSAPP</span><strong>064 680 5363</strong></div><ArrowUpRight size={20} /></a></div></section><section className="section container contact-form-section"><div><Eyebrow>YOUR NEXT STEP</Eyebrow><h2>Let’s find<br /><span>your part.</span></h2><p className="body-copy">Tell us a little about what you need. We’ll prepare a message for you to review and send to our team on WhatsApp.</p><p className="contact-tip">Have a photo of your old part?<br />Add it to your WhatsApp conversation.</p></div><div className="contact-form-panel"><EnquiryForm /></div></section></>;
}
