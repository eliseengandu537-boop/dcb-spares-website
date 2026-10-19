"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useAnimationControls, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const reduced = useReducedMotion();
  const controls = useAnimationControls();
  useEffect(() => {
    if (reduced) { controls.set({ opacity: 1, y: 0 }); return; }
    if (inView) void controls.start({ opacity: 1, y: 0, transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] } });
    else controls.set({ opacity: 0, y: 24 });
  }, [controls, delay, inView, reduced]);
  // The server-rendered content stays visible when JavaScript is unavailable.
  return <motion.div ref={ref} className={className} initial={false} animate={controls}>{children}</motion.div>;
}

export function HeroMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 55]);
  return <motion.div ref={ref} className="hero-art" style={{ y: reduced ? 0 : y }}>{children}</motion.div>;
}

export function Atmosphere() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => { element.style.animationPlayState = entry.isIntersecting && !document.hidden ? "running" : "paused"; });
    const onVisibility = () => { element.style.animationPlayState = document.hidden ? "paused" : "running"; };
    observer.observe(element);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);
  return <div ref={ref} className="atmosphere" aria-hidden="true" />;
}
