"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Matches the reference's Lenis easing and keeps GSAP in the same animation loop. */
export function ScrollMotion() {
  const pathname = usePathname();
  const lenis = useRef<Lenis | null>(null);
  const restoring = useRef(false);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const scroll = new Lenis({ content: document.body, lerp: 0.09, anchors: true });
    lenis.current = scroll;
    const update = () => ScrollTrigger.update();
    const tick = (time: number) => scroll.raf(time * 1000);
    const resize = () => scroll.resize();
    const popstate = () => { restoring.current = true; };
    scroll.on("scroll", update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.addEventListener("refresh", resize);
    window.addEventListener("popstate", popstate);
    return () => {
      window.removeEventListener("popstate", popstate);
      ScrollTrigger.removeEventListener("refresh", resize);
      gsap.ticker.remove(tick);
      scroll.off("scroll", update);
      scroll.destroy();
      lenis.current = null;
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, []);
  useEffect(() => {
    if (restoring.current) restoring.current = false;
    else lenis.current?.scrollTo(0, { immediate: true, force: true });
    lenis.current?.resize();
    const indicator = document.querySelector<HTMLElement>('[data-complete]');
    const number = indicator?.querySelector<HTMLElement>("span.tabular-nums");
    const marker = indicator?.querySelector<HTMLElement>("div > span");
    const update = () => {
      const available = document.documentElement.scrollHeight - innerHeight;
      const progress = Math.max(0, Math.min(100, available > 0 ? scrollY / available * 100 : 0));
      if (number) number.textContent = `${Math.round(progress).toString().padStart(3, "0")}%`;
      if (marker) marker.style.transform = `translateY(${progress / 100 * 56}px)`;
      if (indicator) indicator.dataset.complete = String(progress >= 99.5);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);
  return null;
}
