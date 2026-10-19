import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export function Wordmark() {
  return <span className="wordmark"><Image src="/images/original/dcb-logo.webp" alt="DCB Auto Electrical Spares" width={275} height={200} priority /></span>;
}

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <p className={`eyebrow${light ? " light" : ""}`}><span aria-hidden="true" />{children}</p>;
}

export function ButtonLink({ href, children, secondary = false, external = false, className = "" }: { href: string; children: ReactNode; secondary?: boolean; external?: boolean; className?: string }) {
  const classes = `button ${secondary ? "button-secondary" : "button-primary"} ${className}`;
  const content = <>{children}{external ? <ArrowUpRight size={17} /> : <ArrowRight size={17} />}</>;
  return external ? <a href={href} className={classes} target="_blank" rel="noopener noreferrer">{content}</a> : <Link href={href} className={classes}>{content}</Link>;
}

export function PageHeading({ eyebrow, title, accent, children }: { eyebrow: string; title: string; accent: string; children: ReactNode }) {
  return <section className="page-heading container"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}<br /><span>{accent}</span></h1><p className="lede">{children}</p><div className="page-heading-rule"><span>AUTO-ELECTRICAL. ALL THE WAY.</span><ArrowDown size={17} /></div></section>;
}
