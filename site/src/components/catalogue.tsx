"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Search, SlidersHorizontal, X } from "lucide-react";
import { categories } from "@/lib/data";
import type { ProductSummary } from "@/lib/catalogue";
import { ProductCard } from "./products";
import { EnquiryButton } from "./enquiry";

type Props = { items: ProductSummary[]; category?: string; brand?: string; brandOptions?: { slug: string; name: string }[] };
const perPage = 24;

export function PartCard({ product }: { product: ProductSummary }) {
  return <Link prefetch={false} href={`/product/${product.slug}/`} className="part-card"><div className="part-card-image">{product.thumbnail ? <Image src={product.thumbnail} alt={product.name} width={380} height={320} loading="lazy" /> : <span>Image unavailable</span>}<span className="part-card-arrow"><ArrowUpRight size={18} /></span></div><div className="part-card-copy"><span className="part-code">{product.code || `DCB ${product.id}`}</span><h3>{product.name}</h3><span className="part-detail-link">View specifications<ArrowRight size={14} /></span></div></Link>;
}

function CatalogueContent({ items, category, brand, brandOptions = [] }: Props) {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [view, setView] = useState(params.get("view") === "ranges" && !category && !brand ? "ranges" : "parts");
  const [selectedCategory, setSelectedCategory] = useState(category ?? "");
  const [selectedBrand, setSelectedBrand] = useState(brand ?? "");
  const [group, setGroup] = useState("All products");
  const [sort, setSort] = useState("catalogue");
  const [page, setPage] = useState(1);
  const top = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Search renders after the static fallback. Resolve incoming shortcuts
    // once their target exists, without opening the phone keyboard.
    const anchor = window.location.hash.slice(1);
    if (!["catalogue-search", "catalogue-filters", "product-list"].includes(anchor)) return;
    const frame = requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ block: "start", behavior: "instant" }));
    return () => cancelAnimationFrame(frame);
  }, []);
  const filtered = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const result = items.filter(p => (!selectedCategory || p.categories.includes(selectedCategory)) && (!selectedBrand || p.brands.includes(selectedBrand)) && terms.every(t => p.search.includes(t)));
    if(sort === "name") result.sort((a,b) => a.name.localeCompare(b.name));
    if(sort === "code") result.sort((a,b) => a.code.localeCompare(b.code, undefined, {numeric:true}));
    return result;
  }, [items, query, selectedCategory, selectedBrand, sort]);
  const ranges = categories.filter(c => (group === "All products" || c.group === group) && `${c.name} ${c.keywords}`.toLowerCase().includes(query.toLowerCase().trim()));
  const pages = Math.ceil(filtered.length / perPage);
  const visible = filtered.slice((page - 1) * perPage, page * perPage);
  const hasFilters = Boolean(query || selectedCategory !== (category ?? "") || selectedBrand !== (brand ?? "") || group !== "All products");
  function reset() {setQuery("");setSelectedCategory(category ?? "");setSelectedBrand(brand ?? "");setGroup("All products");setPage(1);}
  function changePage(value: number) {setPage(value);top.current?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",block:"start"});}
  return <section className="container catalogue-section" id="product-list"><div ref={top} className="catalogue-top">
    <p className="catalogue-fitment-note">Aftermarket replacements. Vehicle makes and OE numbers identify compatibility, not the manufacturer of a part.</p>
    {!category && !brand && <div className="catalogue-tabs" aria-label="Catalogue view"><button aria-pressed={view === "parts"} onClick={() => {setView("parts");reset();}}>All parts <span>{items.length.toLocaleString("en-GB")}</span></button><button aria-pressed={view === "ranges"} onClick={() => {setView("ranges");reset();}}>Product ranges <span>16</span></button></div>}
    </div>
    <div className="catalogue-sticky-search"><div className="catalogue-search"><Search size={20} /><label className="sr-only" htmlFor="catalogue-search">Search products</label><input id="catalogue-search" type="search" enterKeyHint="search" value={query} onChange={event => {setQuery(event.target.value);setPage(1);}} placeholder={view === "parts" ? "Part number, vehicle or part name…" : "Search product ranges…"} />{query && <button className="icon-button" onClick={() => {setQuery("");setPage(1);}} aria-label="Clear search"><X size={18} /></button>}</div><a className="catalogue-filter-link" href="#catalogue-filters" aria-label="Go to filters"><SlidersHorizontal size={18} /><span>Filters</span></a></div>
    <div className="catalogue-controls" id="catalogue-filters">
    {view === "parts" ? <div className="part-filters">{!category && <label>Product range<select value={selectedCategory} onChange={e => {setSelectedCategory(e.target.value);setPage(1);}}><option value="">All ranges</option>{categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>}{!brand && brandOptions.length > 0 && <label>Vehicle brand<select value={selectedBrand} onChange={e => {setSelectedBrand(e.target.value);setPage(1);}}><option value="">All makes</option>{brandOptions.map(b => <option key={b.slug} value={b.slug}>{b.name}</option>)}</select></label>}<label>Sort by<select value={sort} onChange={e => {setSort(e.target.value);setPage(1);}}><option value="catalogue">Catalogue order</option><option value="name">Product name</option><option value="code">Part number</option></select></label></div> : <div className="catalogue-filters" aria-label="Filter by system">{["All products","Starting","Charging","Lighting","Electrical"].map(value => <button key={value} onClick={() => setGroup(value)} aria-pressed={group === value} className={group === value ? "selected" : ""}>{value}</button>)}</div>}</div>
    <div className="catalogue-result-line"><span role="status" aria-live="polite">{view === "parts" ? `${filtered.length.toLocaleString("en-GB")} products${filtered.length ? ` · Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, filtered.length)}` : ""}` : `${ranges.length} product ranges`}{query ? ` matching “${query}”` : ""}</span>{hasFilters ? <button className="text-link catalogue-clear-filters" onClick={reset}><X size={14} />Clear filters</button> : <span>THE RIGHT PART STARTS HERE</span>}</div>
    {view === "parts" && visible.length > 0 ? <><div className="parts-grid">{visible.map(p => <PartCard key={p.id} product={p} />)}</div>{pages > 1 && <nav className="catalogue-pagination" aria-label="Product pages"><button disabled={page === 1} onClick={() => changePage(page-1)}><ArrowLeft size={17} />Previous</button><span>Page <b>{page}</b> of {pages}</span><button disabled={page === pages} onClick={() => changePage(page+1)}>Next<ArrowRight size={17} /></button></nav>}</> : view === "ranges" && ranges.length > 0 ? <div className="catalogue-grid">{ranges.map(c => <ProductCard key={c.slug} category={c} index={categories.indexOf(c)} />)}</div> : <div className="empty-state"><Search size={32} /><h2>Let’s find it together.</h2><p>No products match these filters. Send us your part number or vehicle details and we’ll help.</p><EnquiryButton part={query}>Ask about this part</EnquiryButton><button className="text-link" onClick={reset}>Reset all filters</button></div>}
    <p className="image-caption">Original DCB catalogue photographs and specifications. Our team confirms current availability, pricing and vehicle fit.</p>
  </section>;
}

export function Catalogue(props: Props) {return <Suspense fallback={<section className="container catalogue-section"><div className="parts-grid">{props.items.slice(0,24).map(p => <PartCard key={p.id} product={p} />)}</div></section>}><CatalogueContent {...props} /></Suspense>;}
