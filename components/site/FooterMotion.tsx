"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

const FooterTorus = dynamic(
  () => import("./footer-torus").then((module) => module.FooterTorus),
  { ssr: false },
);

function bindMarquee(container: HTMLElement, reduced: boolean) {
  const svg = container.querySelector("svg");
  const curve = container.querySelector<SVGPathElement>("defs path");
  const measure = container.querySelector<SVGTextElement>(
    'text[visibility="hidden"]',
  );
  const text = container.querySelector<SVGTextPathElement>("textPath");
  if (!svg || !curve || !measure || !text) return () => {};
  const mobile = matchMedia("(max-width: 639px)");
  let tween: gsap.core.Tween | undefined;
  let observer: IntersectionObserver | undefined;
  let cancelled = false;
  let dragging = false;
  let visible = false;
  let previousX = 0;
  let previousTime = 0;
  let velocity = 0;
  let duration = 22;
  let inertia: ((time: number, delta: number) => void) | undefined;
  const stopInertia = () => {
    if (inertia) gsap.ticker.remove(inertia);
    inertia = undefined;
    tween?.timeScale(1);
  };
  const start = () => {
    if (cancelled) return;
    tween?.kill();
    observer?.disconnect();
    duration = mobile.matches ? 24.2 : 22;
    svg.setAttribute(
      "viewBox",
      mobile.matches ? "0 -130 1400 510" : "0 165 1400 175",
    );
    svg.style.fontSize = mobile.matches
      ? "clamp(120px, 26vw, 160px)"
      : "var(--text-display-m)";
    const length = curve.getTotalLength();
    const textLength = measure.getComputedTextLength();
    if (reduced || !length || !textLength) return;
    gsap.set(text, { attr: { startOffset: "0%" } });
    tween = gsap.to(text, {
      attr: { startOffset: `-${(textLength / length) * 100}%` },
      duration,
      ease: "none",
      repeat: -1,
    });
    observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !dragging) tween?.resume();
      else if (!visible) {
        stopInertia();
        tween?.pause();
      }
    });
    observer.observe(container);
  };
  const down = (event: PointerEvent) => {
    if (!tween) return;
    dragging = true;
    previousX = event.clientX;
    previousTime = event.timeStamp;
    velocity = 0;
    stopInertia();
    tween.pause();
    container.setPointerCapture(event.pointerId);
    container.style.cursor = "grabbing";
  };
  const move = (event: PointerEvent) => {
    if (!dragging || !tween) return;
    const distance = event.clientX - previousX;
    previousX = event.clientX;
    const shift = (-distance / (window.innerWidth || 1)) * duration;
    const time = tween.time() + shift;
    tween.time(((time % duration) + duration) % duration);
    const delta = event.timeStamp - previousTime;
    previousTime = event.timeStamp;
    if (delta > 0) velocity = gsap.utils.clamp(-10, 10, (shift / delta) * 1000);
  };
  const up = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    if (container.hasPointerCapture(event.pointerId))
      container.releasePointerCapture(event.pointerId);
    container.style.cursor = "grab";
    if (!visible || !tween) return;
    const momentum = event.timeStamp - previousTime > 120 ? 1 : velocity;
    if (momentum < 0) tween.totalTime(tween.time() + duration);
    tween.timeScale(momentum).resume();
    if (Math.abs(momentum - 1) > 0.01) {
      const animation = tween;
      inertia = (_time, delta) => {
        const speed = animation.timeScale();
        const next = speed + (1 - speed) * (1 - Math.exp((-delta / 1000) * 2));
        if (Math.abs(next - 1) < 0.01) stopInertia();
        else animation.timeScale(next);
      };
      gsap.ticker.add(inertia);
    }
  };
  void document.fonts.ready.then(start);
  mobile.addEventListener("change", start);
  container.addEventListener("pointerdown", down);
  container.addEventListener("pointermove", move);
  container.addEventListener("pointerup", up);
  container.addEventListener("pointercancel", up);
  return () => {
    cancelled = true;
    stopInertia();
    observer?.disconnect();
    tween?.kill();
    mobile.removeEventListener("change", start);
    container.removeEventListener("pointerdown", down);
    container.removeEventListener("pointermove", move);
    container.removeEventListener("pointerup", up);
    container.removeEventListener("pointercancel", up);
  };
}

/** Owns footer animation while its semantic content remains server rendered. */
export function FooterMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const scope = useRef<HTMLDivElement>(null);
  const [footer, setFooter] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const element = scope.current?.querySelector<HTMLElement>(
      "[data-footer-section]",
    );
    if (!element) return;
    setFooter(element);
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const disposers: Array<() => void> = [];
    const marquee = element.querySelector<HTMLElement>(
      "[data-framework-marquee]",
    );
    if (marquee) disposers.push(bindMarquee(marquee, reduced));
    const clocks = Array.from(
      element.querySelectorAll<HTMLElement>('[aria-label="--:--"]'),
    );
    const zones = ["America/Monterrey", "America/Chicago", "Asia/Dubai"];
    const updateClocks = () =>
      clocks.forEach((clock, index) => {
        const value = new Intl.DateTimeFormat("en-GB", {
          timeZone: zones[index % zones.length],
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date());
        clock.textContent = value;
        clock.setAttribute("aria-label", value);
      });
    updateClocks();
    const clockInterval = window.setInterval(updateClocks, 30_000);
    disposers.push(() => clearInterval(clockInterval));
    const context = gsap.context(() => {
      if (reduced) return;
      const heading = element.querySelector("h2");
      if (heading) {
        const split = SplitText.create(heading, {
          type: "words",
          wordsClass: "inline-block [will-change:filter,opacity]",
        });
        const dot = heading.querySelector("svg");
        const words = dot ? [...split.words, dot] : split.words;
        gsap.set(words, { opacity: 0, filter: "blur(10px)" });
        const reveal = () => {
          gsap.set(words, { opacity: 0, filter: "blur(10px)" });
          gsap.to(words, {
            opacity: 1,
            filter: "blur(0px)",
            duration: 1.2,
            ease: "expo.out",
            stagger: { amount: 1.2, from: "start" },
            overwrite: true,
          });
        };
        ScrollTrigger.create({
          trigger: heading,
          start: "top 85%",
          onEnter: reveal,
          onEnterBack: reveal,
        });
        disposers.push(() => split.revert());
      }
      gsap.fromTo(
        "[data-footer-comm-card]",
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: "[data-footer-comms]",
            start: "top 85%",
            once: true,
          },
        },
      );
      gsap.fromTo(
        "[data-footer-social-pill]",
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "expo.out",
          stagger: 0.06,
          scrollTrigger: {
            trigger: "[data-footer-socials]",
            start: "top 85%",
            once: true,
          },
        },
      );
      gsap.fromTo(
        ["[data-footer-strip-row]", "[data-footer-meta]"],
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.15,
          scrollTrigger: { trigger: element, start: "top 40%", once: true },
        },
      );
    }, element);
    const refresh = () => ScrollTrigger.refresh();
    void document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      context.revert();
      disposers.forEach((dispose) => dispose());
    };
  }, [pathname]);
  return (
    <div ref={scope} style={{ display: "contents" }}>
      {children}
      {footer ? createPortal(<FooterTorus key={pathname} />, footer) : null}
    </div>
  );
}

export default FooterMotion;
