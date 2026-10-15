"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { bindMethod } from "../home/method-motion";

/** Runs the archived design's shared hero and editorial reveal choreography. */
export function PageMotion() {
  const pathname = usePathname();
  useEffect(() => {
    gsap.registerPlugin(SplitText, ScrollTrigger, MorphSVGPlugin);
    const main = document.querySelector("main");
    if (!main) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const splits: SplitText[] = [];
    const cleanup: Array<() => void> = [];
    const context = gsap.context(() => {
      const elements = Array.from(main.querySelectorAll<HTMLElement>("[data-reveal-blur], [data-reveal-fade], [data-reveal-fade-stagger]"));
      const timeline = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.2 });
      let at = 0;
      elements.forEach(element => {
        if (reduced) { gsap.set(element, { opacity: 1 }); return; }
        if (element.hasAttribute("data-reveal-blur")) {
          const split = SplitText.create(element, { type: "words", wordsClass: "inline-block [will-change:filter,opacity]" });
          splits.push(split);
          gsap.set(element, { opacity: 1 });
          gsap.set(split.words, { opacity: 0, filter: "blur(10px)" });
          timeline.to(split.words, { opacity: 1, filter: "blur(0px)", duration: 1.2, stagger: { amount: 1.2, from: "start" }, onComplete: () => { gsap.set(split.words, { clearProps: "filter,willChange" }); } }, at);
          at += 0.55;
        } else if (element.hasAttribute("data-reveal-fade-stagger")) {
          const children = Array.from(element.children);
          gsap.set(element, { opacity: 1 });
          gsap.set(children, { opacity: 0, y: 18 });
          timeline.to(children, { opacity: 1, y: 0, duration: 0.9, stagger: 0.16 }, at);
          at += 0.5 + children.length * 0.16;
        } else {
          gsap.set(element, { opacity: 0, y: 18 });
          timeline.to(element, { opacity: 1, y: 0, duration: 0.85 }, at);
          at += 0.4;
        }
      });
      main.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-stagger]").forEach(element => {
        const targets = element.hasAttribute("data-reveal-stagger") ? Array.from(element.children) : element;
        if (reduced) { gsap.set(targets, { autoAlpha: 1, y: 0 }); return; }
        const bounds = element.getBoundingClientRect();
        if (bounds.top < innerHeight - 24 && bounds.bottom > 0) return;
        gsap.fromTo(targets, { autoAlpha: 0, y: element.hasAttribute("data-reveal-stagger") ? 24 : 40 }, { autoAlpha: 1, y: 0, duration: 1.2, stagger: { amount: 0.6 }, scrollTrigger: { trigger: element, start: "top 85%", toggleActions: "restart none restart none" } });
      });
      const method = main.querySelector<HTMLElement>("[data-method]");
      if (method && pathname !== "/" && pathname !== "/es") cleanup.push(bindMethod(method, reduced));
      // Native one-shot image sequence: 0.57s steps, then hold the final cover.
      const groups = new Set(Array.from(main.querySelectorAll<HTMLElement>("[data-slide]")).map(slide => slide.parentElement!));
      groups.forEach(group => {
        const slides = Array.from(group.querySelectorAll<HTMLElement>(":scope > [data-slide]"));
        if (!slides.length) return;
        if (reduced || document.hidden || matchMedia("(max-width: 767px)").matches) {
          gsap.set(slides, { opacity: 0, scale: 1 });
          gsap.set(slides[slides.length - 1], { opacity: 1 });
          return;
        }
        gsap.set(slides, { opacity: 0, scale: 1.3 });
        gsap.set(slides[0], { opacity: 1 });
        const animation = gsap.timeline({ delay: 0.5, defaults: { ease: "power2.inOut", force3D: true } });
        slides.forEach((slide, index) => {
          const start = index * 0.57;
          animation.to(slide, { scale: 1, duration: 1.75 }, start);
          if (index > 0) {
            animation.to(slide, { opacity: 1, duration: 0.7 }, start);
            animation.to(slides[index - 1], { opacity: 0, duration: 0.7 }, start);
          }
        });
        const finish = () => { if (document.hidden) animation.progress(1); };
        document.addEventListener("visibilitychange", finish);
        cleanup.push(() => document.removeEventListener("visibilitychange", finish));
      });
    }, main);
    document.querySelectorAll<HTMLImageElement>("img.opacity-0").forEach(image => {
      if (!image.classList.contains("transition-[opacity,transform]")) return;
      const reveal = () => { image.classList.replace("opacity-0", "opacity-100"); };
      if (image.complete) reveal();
      else image.addEventListener("load", reveal, { once: true });
      cleanup.push(() => image.removeEventListener("load", reveal));
    });
    const badge = document.querySelector<HTMLElement>('a[aria-label*="Awwwards"]');
    const revealBadge = () => context.add(() => {
      if (!badge) return;
      if (reduced) gsap.set(badge, { autoAlpha: 1 });
      else gsap.fromTo(badge, { y: 24, scale: 0.94, autoAlpha: 0, transformOrigin: "left bottom" }, { y: 0, scale: 1, autoAlpha: 1, duration: 1.2, ease: "expo.out", delay: 0.5 });
    });
    const overlay = document.querySelector<HTMLElement>("[data-intro-overlay]");
    if (overlay && getComputedStyle(overlay).display !== "none") window.addEventListener("we:intro-done", revealBadge, { once: true });
    else revealBadge();
    cleanup.push(() => window.removeEventListener("we:intro-done", revealBadge));
    const refresh = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(refresh);
      cleanup.forEach(dispose => dispose());
      context.revert();
      splits.forEach(split => split.revert());
    };
  }, [pathname]);
  return null;
}
