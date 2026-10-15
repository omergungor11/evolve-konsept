"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

const DOT_POSITIONS = [3, 19.5, 36, 52.5, 66];
const ACCENT = "#E4007C";
const FOREGROUND = "#F0F0F8";

/** The original, seeded Kainos particles are identical on each visit. */
function kainosParticles() {
  let seed = 0x9e3779b9;
  const random = () => {
    seed = (1664525 * seed + 0x3c6ef35f) >>> 0;
    return seed / 0x100000000;
  };
  return Array.from({ length: 12 }, () => ({
    xPct: 15 + 70 * random(),
    yPct: 25 + 50 * random(),
    size: 4 + 7 * random(),
    driftX: (random() - 0.5) * 28,
    driftY: -22 - 22 * random(),
    delay: 0.18 * random(),
  }));
}

function createKainosPrelude(logo: HTMLElement) {
  const variant = logo.dataset.logoFusionVariant === "hero" ? "hero" : "nav";
  const svgWidth = variant === "hero" ? 280 : 96;
  const pngHeight = variant === "hero" ? 140 : 38;
  const overlay = document.createElement("div");
  overlay.className =
    "absolute inset-0 flex items-center justify-center pointer-events-none";
  overlay.dataset.kainosPreludeOverlay = "true";

  const prelude = document.createElement("div");
  prelude.className = `relative flex flex-col items-center ${variant === "hero" ? "gap-2" : "gap-[3px]"}`;
  prelude.dataset.kainosPrelude = "true";

  const wordmarkSpacer = document.createElement("span");
  wordmarkSpacer.className = variant === "hero" ? "h-[64px]" : "h-[14px]";
  wordmarkSpacer.setAttribute("aria-hidden", "true");
  const dotsSpacer = document.createElement("span");
  dotsSpacer.setAttribute("aria-hidden", "true");
  Object.assign(dotsSpacer.style, {
    display: "block",
    width: `${svgWidth}px`,
    height: `${Math.round((8 * svgWidth) / 69)}px`,
  });

  const imageContainer = document.createElement("div");
  imageContainer.className = "pointer-events-none absolute left-1/2 top-1/2";
  Object.assign(imageContainer.style, {
    transform: "translate(-50%, -50%)",
    width: `${Math.round((pngHeight * 500) / 300)}px`,
    height: `${pngHeight}px`,
  });
  const image = document.createElement("img");
  image.src = "/brand/logo-kainos.png";
  image.alt = "Kainos";
  image.className = "block will-change-transform";
  Object.assign(image.style, { width: "100%", height: "100%" });
  const particles = kainosParticles();
  const particleElements = particles.map((particle) => {
    const element = document.createElement("div");
    element.setAttribute("aria-hidden", "true");
    element.className = "absolute rounded-full will-change-transform";
    Object.assign(element.style, {
      left: `${particle.xPct}%`,
      top: `${particle.yPct}%`,
      width: `${particle.size}px`,
      height: `${particle.size}px`,
      backgroundColor: FOREGROUND,
      opacity: "0",
    });
    return element;
  });
  imageContainer.append(image, ...particleElements);
  prelude.append(wordmarkSpacer, dotsSpacer, imageContainer);
  overlay.append(prelude);
  const parent = logo.parentElement;
  if (!parent) return null;
  parent.append(overlay);
  return { overlay, image, particles, particleElements };
}

/**
 * Binds the native brand choreography to the preserved SVG/wordmark markup.
 * No archived application scripts are executed.
 */
export function bindLogoFusion(scope: ParentNode = document) {
  gsap.registerPlugin(SplitText);
  const dispose: Array<() => void> = [];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const logos = Array.from(
    scope.querySelectorAll<HTMLElement>("[data-logo-fusion]"),
  );

  logos.forEach((logo) => {
    const svg = logo.querySelector<SVGSVGElement>(":scope > svg");
    const wordmark = logo.querySelector<HTMLElement>(":scope > span");
    const dots = Array.from(
      svg?.querySelectorAll<SVGCircleElement>(":scope > g > circle") ?? [],
    );
    if (!svg || !wordmark || dots.length !== 5) return;

    let complete = false;
    let started = false;
    let split: SplitText | undefined;
    let prelude: ReturnType<typeof createKainosPrelude> = null;
    const context = gsap.context(() => {}, logo);
    const startFusion = () => {
      context.add(() => {
        const accent = dots[4];
        gsap.set(accent, {
          attr: { cx: DOT_POSITIONS[0], fill: ACCENT },
          opacity: 1,
        });
        dots.slice(0, 4).forEach((dot, index) => {
          gsap.set(dot, {
            attr: { cx: DOT_POSITIONS[index], fill: FOREGROUND },
            opacity: 0,
          });
        });
        split = SplitText.create(wordmark, {
          type: "chars",
          charsClass: "fusion-char",
        });
        gsap.set(wordmark, { opacity: 1 });
        gsap.set(split.chars, { yPercent: 110, opacity: 0 });
        const timeline = gsap.timeline({
          delay: 0.3,
          onComplete: () => {
            complete = true;
            split?.revert();
            split = undefined;
          },
        });
        timeline.to({}, { duration: 0.34 });
        for (let index = 0; index < 4; index += 1) {
          timeline.to(
            dots[index],
            { opacity: 1, duration: 0.26, ease: "sine.out" },
            index === 0 ? ">" : ">0.08",
          );
          timeline.to(
            accent,
            {
              attr: { cx: DOT_POSITIONS[index + 1] },
              duration: 0.68,
              ease: "power3.inOut",
            },
            "<",
          );
        }
        timeline.to(
          split.chars,
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.035,
            ease: "expo.out",
          },
          ">-0.476",
        );
      });
    };
    const start = () => {
      if (started) return;
      started = true;
      if (reduced) {
        context.add(() => {
          dots.forEach((dot, index) => {
            gsap.set(dot, {
              attr: {
                cx: DOT_POSITIONS[index],
                fill: index === 4 ? ACCENT : FOREGROUND,
              },
              opacity: 1,
            });
          });
          gsap.set(wordmark, { opacity: 1 });
        });
        complete = true;
        return;
      }

      // The nav first dissolves the predecessor's logo, exactly as the reference.
      if (logo.closest("[data-nav-wordmark]")) {
        prelude = createKainosPrelude(logo);
      }
      if (!prelude) {
        startFusion();
        return;
      }
      const { overlay, image, particleElements, particles } = prelude;
      context.add(() => {
        gsap.set(image, {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          transformOrigin: "center",
        });
        gsap.set(particleElements, {
          xPercent: -50,
          yPercent: -50,
          opacity: 0,
          scale: 0.5,
          x: 0,
          y: 0,
          filter: "blur(2px)",
        });
        const timeline = gsap.timeline({
          onComplete: () => {
            overlay.remove();
            startFusion();
          },
        });
        timeline.to({}, { duration: 2.2 });
        timeline.to(image, {
          opacity: 0,
          scale: 1.1,
          y: -3,
          filter: "blur(6px)",
          duration: 0.85,
          ease: "power2.out",
        });
        const dissolveStart = timeline.duration() - 0.85;
        particleElements.forEach((element, index) => {
          const particle = particles[index];
          const position = dissolveStart + particle.delay;
          timeline.to(
            element,
            { opacity: 0.7, scale: 1.1, duration: 0.34, ease: "sine.out" },
            position,
          );
          timeline.to(
            element,
            {
              opacity: 0,
              scale: 2.2,
              x: particle.driftX,
              y: particle.driftY,
              filter: "blur(8px)",
              duration: 0.595,
              ease: "sine.in",
            },
            position + 0.255,
          );
        });
      });
    };

    const move = (event: MouseEvent) => {
      if (!complete || reduced) return;
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
        matrix.inverse(),
      );
      context.add(() => {
        dots.forEach((dot, index) => {
          const dx = DOT_POSITIONS[index] - point.x;
          const dy = 4 - point.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 14) {
            const strength = (1 - distance / 14) * 6;
            const multiplier = index === 4 ? 0.55 : 1;
            const angle = Math.atan2(dy, dx);
            gsap.to(dot, {
              x: Math.cos(angle) * strength * multiplier,
              y: Math.sin(angle) * strength * multiplier,
              duration: 0.5,
              ease: "power3.out",
              overwrite: "auto",
            });
          } else {
            gsap.to(dot, {
              x: 0,
              y: 0,
              duration: 0.8,
              ease: "elastic.out(1, 0.5)",
              overwrite: "auto",
            });
          }
        });
      });
    };
    const leave = () => {
      context.add(() => {
        gsap.to(dots, {
          x: 0,
          y: 0,
          duration: 0.9,
          ease: "elastic.out(1, 0.5)",
          overwrite: "auto",
        });
      });
    };
    svg.addEventListener("mousemove", move);
    svg.addEventListener("mouseleave", leave);

    const intro = document.querySelector<HTMLElement>("[data-intro-overlay]");
    if (
      intro &&
      getComputedStyle(intro).display !== "none" &&
      getComputedStyle(intro).visibility !== "hidden"
    ) {
      window.addEventListener("we:intro-done", start, { once: true });
    } else {
      start();
    }
    dispose.push(() => {
      window.removeEventListener("we:intro-done", start);
      svg.removeEventListener("mousemove", move);
      svg.removeEventListener("mouseleave", leave);
      context.revert();
      split?.revert();
      prelude?.overlay.remove();
    });
  });
  return () => dispose.forEach((cleanup) => cleanup());
}

/** Mount once alongside the route's preserved server-rendered content. */
export function LogoFusionMotion() {
  const pathname = usePathname();
  useEffect(() => bindLogoFusion(), [pathname]);
  return null;
}
