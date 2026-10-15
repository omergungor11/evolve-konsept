"use client";

import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { bindTestimonials } from "./testimonials";
import { bindMethod } from "./method-motion";

export const HomeReadyContext = createContext(true);

/** Attaches the original motion choreography to the server-rendered home markup. */
export function HomeMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    gsap.registerPlugin(ScrollTrigger, SplitText, MorphSVGPlugin);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = matchMedia("(max-width: 767px)").matches;
    const cleanup: Array<() => void> = [];
    const select = <T extends Element = HTMLElement>(selector: string) =>
      scope.querySelector<T>(selector);
    const all = <T extends Element = HTMLElement>(selector: string) =>
      Array.from(scope.querySelectorAll<T>(selector));
    let cancelled = false;
    const context = gsap.context(() => {
      const overlay = select("[data-intro-overlay]");
      const main = select("[data-home-main]");
      const title = select("[data-hero-title]");
      const sub = select("[data-hero-sub]");
      const extras = all("[data-hero-stats], [data-hero-carousel]");
      if (!reduced && !mobile) {
        gsap.set([title, sub].filter(Boolean), { opacity: 0 });
        gsap.set(extras, { y: 24, opacity: 0 });
      }
      const reveal = () => {
        if (cancelled) return;
        if (main) main.style.visibility = "visible";
        if (overlay) overlay.style.display = "none";
        setReady(true);
        window.dispatchEvent(new CustomEvent("we:intro-done"));
        if (reduced || mobile) return;
        const timeline = gsap.timeline({ defaults: { ease: "expo.out" } });
        cleanup.push(() => timeline.kill());
        [title, sub].forEach((element, i) => {
          if (!element) return;
          const split = SplitText.create(element, {
            type: "words",
            wordsClass: "inline-block [will-change:filter,opacity]",
          });
          cleanup.push(() => split.revert());
          gsap.set(element, { opacity: 1 });
          gsap.set(split.words, { opacity: 0, filter: "blur(10px)" });
          timeline.to(
            split.words,
            {
              opacity: 1,
              filter: "blur(0px)",
              duration: 1.2,
              stagger: { amount: 1.2, from: "start" },
              onComplete: () => {
                gsap.set(split.words, { clearProps: "filter,willChange" });
              },
            },
            i ? 1.4 : 0.6,
          );
        });
        timeline.to(
          select("[data-hero-stats]"),
          { y: 0, opacity: 1, duration: 1.2 },
          2,
        );
        timeline.to(
          select("[data-hero-carousel]"),
          { y: 0, opacity: 1, duration: 1.2 },
          2.6,
        );
      };
      let seen = false;
      try {
        seen = !!sessionStorage.getItem("we_intro_seen");
      } catch {}
      if (reduced || mobile || seen || !overlay) reveal();
      else {
        try {
          sessionStorage.setItem("we_intro_seen", "1");
        } catch {}
        const progress = { value: 0 };
        const number = overlay.querySelector(".tabular-nums > span");
        const phases = Array.from(overlay.querySelectorAll(".mt-14 > div"));
        const renderCount = () => {
          if (number)
            number.textContent = String(Math.round(progress.value)).padStart(
              3,
              "0",
            );
        };
        const intro = gsap.timeline();
        intro.to(
          progress,
          {
            value: 92,
            duration: 2.1,
            ease: "power2.inOut",
            onUpdate: renderCount,
          },
          0,
        );
        phases.forEach((phase, index) =>
          intro.call(
            () => {
              const dot = phase.querySelector<HTMLElement>("span");
              if (dot) {
                dot.style.background =
                  index === 4 ? "var(--color-accent)" : "var(--color-fg)";
                dot.style.borderColor = "currentColor";
                if (index === 4)
                  dot.style.boxShadow = "0 0 14px rgba(228,0,124,.55)";
              }
              const label = phase.querySelector<HTMLElement>("span:last-child");
              if (label) label.style.color = "var(--color-fg)";
            },
            [],
            0.42 * index,
          ),
        );
        intro.to(progress, {
          value: 100,
          duration: 0.35,
          ease: "power2.out",
          onUpdate: renderCount,
        });
        intro.to({}, { duration: 0.5 });
        intro.to(overlay, {
          autoAlpha: 0,
          duration: 0.6,
          ease: "expo.inOut",
          onComplete: reveal,
        });
      }

      const carousel = select("[data-hero-carousel]");
      if (carousel) cleanup.push(bindTestimonials(carousel, reduced));
      if (!reduced) {
        all(
          "[data-hero-stats] .whitespace-nowrap.will-change-transform",
        ).forEach((track) => {
          const width = track.scrollWidth / 4;
          if (width <= 0) return;
          const tween = gsap.to(track, {
            x: `-=${width}`,
            duration: 70,
            ease: "none",
            repeat: -1,
            modifiers: { x: gsap.utils.unitize(gsap.utils.wrap(-width, 0)) },
          });
          const observer = new IntersectionObserver((entries) =>
            entries.forEach((entry) => {
              if (entry.isIntersecting) tween.play();
              else tween.pause();
            }),
          );
          observer.observe(track.parentElement ?? track);
          cleanup.push(() => {
            observer.disconnect();
            tween.kill();
          });
        });
        const sources = all(
          "[data-hero-stats] span.relative.inline-flex.h-\\[18px\\] > span",
        );
        if (sources.length) {
          let active = 0;
          const interval = window.setInterval(() => {
            active = (active + 1) % sources.length;
            sources.forEach((source, index) => {
              source.style.opacity = index === active ? "1" : "0";
            });
          }, 3200);
          cleanup.push(() => clearInterval(interval));
        }
        const ink = all("div[style]").find(
          (el) =>
            el.style.filter === 'url("#ink-edge")' ||
            el.style.filter === "url(#ink-edge)",
        );
        const fill = ink?.firstElementChild;
        const method = select("[data-method]");
        if (fill && method) {
          gsap.set(fill, { scaleY: 0 });
          gsap.to(fill, {
            scaleY: 1,
            ease: (value: number) =>
              value < 0.02
                ? (value / 0.02) * 0.18
                : 0.18 + ((value - 0.02) / 0.98) * 0.82,
            scrollTrigger: {
              trigger: method,
              start: "top bottom",
              end: "top -25%",
              scrub: true,
            },
          });
        }
      }
      const method = select("[data-method]");
      if (method) cleanup.push(bindMethod(method, reduced));
      const refresh = requestAnimationFrame(() => ScrollTrigger.refresh());
      cleanup.push(() => cancelAnimationFrame(refresh));
    }, scope);
    return () => {
      cancelled = true;
      cleanup.forEach((dispose) => dispose());
      context.revert();
    };
  }, []);

  return (
    <HomeReadyContext.Provider value={ready}>
      <div ref={root} style={{ display: "contents" }}>
        {children}
      </div>
    </HomeReadyContext.Provider>
  );
}

export default HomeMotion;
