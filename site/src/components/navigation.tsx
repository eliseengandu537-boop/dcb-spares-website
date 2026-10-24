"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import { Wordmark } from "./ui";
import { EnquiryButton } from "./enquiry";
import { whatsapp } from "@/lib/data";

const links = [{ label: "Our products", href: "/products/" }, { label: "About DCB", href: "/about/" }, { label: "Vehicle brands", href: "/brands/" }, { label: "Contact", href: "/contact/" }];

export function Navigation() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href) || (href === "/products/" && /^\/(product|category)\//.test(pathname)) || (href === "/about/" && pathname.startsWith("/about-us")) || (href === "/contact/" && pathname.startsWith("/contact-us"));
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function dismiss(event: KeyboardEvent) { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } }
    function outside(event: PointerEvent) { if (header.current && !header.current.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("keydown", dismiss); document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", dismiss); document.removeEventListener("pointerdown", outside); };
  }, [open]);
  return <header className="site-header" ref={header}>
    <div className="utility-bar"><div className="container utility-content"><span>YOUR AUTO-ELECTRICAL CONNECTION</span><div><span className="locations">ALRODE <i /> CAPE TOWN</span><a href={whatsapp()} target="_blank" rel="noopener noreferrer"><span className="online-dot" />WhatsApp us<ArrowUpRight size={12} /></a></div></div></div>
    <div className="nav-shell"><div className="container nav-content"><Link href="/" aria-label="DCB Spares home" onClick={() => setOpen(false)}><Wordmark /></Link><nav className="desktop-nav" aria-label="Main navigation">{links.map(link => <Link key={link.href} className={isActive(link.href) ? "active" : ""} href={link.href} aria-current={isActive(link.href) ? "page" : undefined}>{link.label}</Link>)}</nav><div className="nav-actions"><Link href="/products/#catalogue-search" className="icon-button search-button" aria-label="Search parts"><Search size={20} /></Link><EnquiryButton className="button button-nav">Find my part</EnquiryButton><button ref={toggle} className="icon-button menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"}>{open ? <X /> : <Menu />}</button></div></div></div>
    {open && <nav className="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">{links.map((link, index) => <Link href={link.href} key={link.href} onClick={() => setOpen(false)}><span>0{index + 1}</span>{link.label}<ArrowUpRight size={19} /></Link>)}<a href={whatsapp()} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}><span>05</span>WhatsApp our team<ArrowUpRight size={19} /></a></nav>}
  </header>;
}
