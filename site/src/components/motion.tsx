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

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const textFreeStart = 4.2;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let isVisible = true;
    let disposed = false;

    const playWhenReady = () => {
      if (disposed || reduced || !isVisible || document.hidden || video.readyState < 2) return;
      void video.play().catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("The hero background video could not start playing.", error);
        }
      });
    };

    const onSeeked = () => {
      if (video.currentTime < textFreeStart) return;
      video.classList.add("is-ready");
      playWhenReady();
    };

    const startTextFreeSegment = () => {
      if (video.currentTime < textFreeStart || video.currentTime >= video.duration - 0.25) {
        video.currentTime = textFreeStart;
      }
    };

    const onTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 0.25) {
        video.currentTime = textFreeStart;
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) playWhenReady();
      else video.pause();
    });
    const onVisibilityChange = () => {
      if (document.hidden) video.pause();
      else playWhenReady();
    };

    observer.observe(video);
    video.addEventListener("loadedmetadata", startTextFreeSegment);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("timeupdate", onTimeUpdate);
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (video.readyState >= 1) startTextFreeSegment();

    return () => {
      disposed = true;
      observer.disconnect();
      video.removeEventListener("loadedmetadata", startTextFreeSegment);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("timeupdate", onTimeUpdate);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      video.pause();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="hero-background-video"
      src="/videos/hero-background.mp4"
      poster="/images/original/hero-alternator.webp"
      muted
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
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
