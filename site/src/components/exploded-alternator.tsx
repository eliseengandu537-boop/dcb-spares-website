"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Atmosphere } from "@/components/motion";
import { ButtonLink, Eyebrow } from "@/components/ui";
import { EnquiryButton } from "@/components/enquiry";
import { TrustLine } from "@/components/sections";
import type { AlternatorScene } from "@/lib/alternator-scene";
import "./alternator.css";

const components = [
  { title: "Rear housing", label: "REAR HOUSING", description: "A vented aluminium casing supports the rear bearing and protects the electrical connections." },
  { title: "Rectifier & regulator", label: "RECTIFIER", description: "Diodes turn alternating current into direct current. The regulator controls the charging voltage." },
  { title: "Copper stator", label: "COPPER STATOR", description: "Stationary copper windings generate alternating current as the rotor’s magnetic field passes through them." },
  { title: "Rotor & shaft", label: "ROTOR & SHAFT", description: "Driven by the engine, the rotor turns inside the stator to create the changing magnetic field." },
  { title: "Front housing & fan", label: "FRONT HOUSING", description: "The front bearing supports the shaft, while the fan and open vents move cooling air through the unit." },
  { title: "Drive pulley", label: "DRIVE PULLEY", description: "The engine’s belt drives this grooved pulley, transferring rotation to the alternator shaft." },
];
const ease = (value: number, from: number, to: number) => {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

export function ExplodedAlternator() {
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const tags = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"loading" | "interactive" | "static">("loading");
  const [selected, setSelected] = useState(2);

  useEffect(() => {
    const section = track.current, viewport = stage.current, mount = host.current;
    if (!section || !viewport || !mount) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let scene: AlternatorScene | undefined;
    let disposed = false, frame = 0, target = 0, current = 0, start = 0, range = 1;
    let visible = true, loading = false;
    const measurements = () => {
      start = window.scrollY + viewport.getBoundingClientRect().top;
      range = Math.max(1, viewport.offsetHeight * 0.6);
    };
    const paint = () => {
      section.dataset.phase = current < 0.08 ? "assembled" : current > 0.9 ? "exploded" : "opening";
      if (tags.current) tags.current.style.opacity = String(ease(current, 0.6, 0.84));
      scene?.update(current);
    };
    const tick = () => {
      frame = 0;
      if (disposed || !visible || document.hidden || preference.matches || !scene) return;
      current += (target - current) * 0.18;
      if (Math.abs(target - current) < 0.0003) current = target;
      paint();
      if (current !== target) frame = requestAnimationFrame(tick);
    };
    const scroll = () => {
      target = Math.max(0, Math.min(1, (window.scrollY - start) / range));
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const resize = () => { measurements(); scroll(); };
    const fallback = () => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = 0;
      scene?.dispose();
      scene = undefined;
      setMode("static");
    };
    const initialise = async () => {
      if (preference.matches) { fallback(); return; }
      if (scene || loading || disposed) return;
      loading = true;
      try {
        const { createAlternatorScene } = await import("@/lib/alternator-scene");
        if (disposed || preference.matches) return;
        scene = createAlternatorScene(mount, Array.from(tags.current?.children ?? []) as HTMLElement[], fallback);
        setMode("interactive");
        requestAnimationFrame(() => { if (!disposed) { measurements(); scroll(); paint(); } });
      } catch {
        fallback();
      } finally { loading = false; }
    };
    const onPreference = () => { if (preference.matches) fallback(); else void initialise(); };
    const visibility = () => { if (!document.hidden) scroll(); };
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { void initialise(); scroll(); }
    }, { rootMargin: "200px" });
    intersection.observe(viewport);
    const observer = new ResizeObserver(resize);
    observer.observe(section);
    observer.observe(viewport);
    preference.addEventListener("change", onPreference);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", visibility);
    measurements();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      scene?.dispose();
      intersection.disconnect();
      observer.disconnect();
      preference.removeEventListener("change", onPreference);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  return (
    <section className="alternator-experience" ref={track} data-mode={mode} data-phase="assembled" aria-label="Explore the alternator">
      <div className="alternator-stage" ref={stage}>
        <Atmosphere />
        <div className="alternator-ambient" aria-hidden="true" />
        <div className="alternator-fallback">
          <Image src="/images/original/hero-alternator.webp" alt="DCB GB alternator" fill priority sizes="(max-width: 760px) 90vw, 55vw" />
        </div>
        <div className="alternator-canvas" ref={host} role="img" aria-label="Interactive exploded alternator: rear housing, rectifier, copper stator, rotor, front housing and drive pulley" />
        <div className="alternator-part-tags" ref={tags} aria-hidden="true">
          {components.map((part, index) => <span className={index % 2 ? "tag-below" : "tag-above"} key={part.title}><b>{String(index + 1).padStart(2, "0")}</b><em>{part.label}</em></span>)}
        </div>
        <div className="container alternator-intro">
          <div className="hero-copy">
            <Eyebrow>PRIMARY DISTRIBUTOR OF GB PRODUCTS</Eyebrow>
            <h1>Power<br />every <span>journey.</span></h1>
            <p>DCB Spares is the primary distributor of GB products.<br />Aftermarket auto-electrical spares in Alrode and Cape Town.</p>
            <div className="button-group">
              <ButtonLink href="/products/">Explore our parts</ButtonLink>
              <EnquiryButton className="button button-ghost">Find my part</EnquiryButton>
            </div>
            <TrustLine />
            <a className="hero-browse-link" href="#range">Browse product ranges<ArrowDown size={15} /></a>
          </div>
          <div className="alternator-product-note"><span className="product-marker" /><div><small>BUILT TO KEEP YOU MOVING</small><Link href="/products/alternators/">Explore alternators <ArrowUpRight size={15} /></Link></div></div>
        </div>
      </div>
      <details className="alternator-explainer container">
        <summary><span>Inside the alternator<small>Explore the six components</small></span><ChevronDown size={20} /></summary>
        <div className="alternator-detail-panel">
          <div className="alternator-part-navigation" role="group" aria-label="Alternator components">
            {components.map((part, index) => <button key={part.title} type="button" onClick={() => setSelected(index)} aria-pressed={selected === index}><span>{String(index + 1).padStart(2, "0")}</span>{part.title}</button>)}
          </div>
          <div className="alternator-part-description" aria-live="polite" aria-atomic="true">
            <span>{String(selected + 1).padStart(2, "0")}</span>
            <h3>{components[selected].title}</h3>
            <p>{components[selected].description}</p>
            <Link href="/products/alternators/">Find your alternator <ArrowUpRight size={15} /></Link>
          </div>
        </div>
        <p className="alternator-model-caption">Illustrative 3D assembly. Confirm the correct part and fit with our team.</p>
      </details>
    </section>
  );
}
