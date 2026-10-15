import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { bindMethodSweep } from "./method-sweep";

function circle(x: number, y: number, radius: number) {
  const control = 0.5522847498 * radius;
  return `M ${x - radius} ${y} C ${x - radius} ${y - control}, ${x - control} ${y - radius}, ${x} ${y - radius} C ${x + control} ${y - radius}, ${x + radius} ${y - control}, ${x + radius} ${y} C ${x + radius} ${y + control}, ${x + control} ${y + radius}, ${x} ${y + radius} C ${x - control} ${y + radius}, ${x - radius} ${y + control}, ${x - radius} ${y} Z`;
}
function letter(x: number, isE: boolean) {
  const left = x - 15,
    right = x + 15,
    stem = left + 8;
  if (isE)
    return `M ${left} 25 L ${right} 25 L ${right} 35 L ${stem} 35 L ${stem} 45 L ${right - 3} 45 L ${right - 3} 55 L ${stem} 55 L ${stem} 65 L ${right} 65 L ${right} 75 L ${left} 75 Z ${circle(x, 50, 0.4)}`;
  const control = 0.5522847498 * (right - stem),
    innerRight = right - 10,
    radius = Math.min(15, innerRight - stem),
    innerControl = 0.5522847498 * radius,
    innerCenter = innerRight - radius;
  return `M ${left} 75 L ${left} 25 L ${stem} 25 C ${stem + control} 25, ${right} ${50 - control}, ${right} 50 C ${right} ${50 + control}, ${stem + control} 75, ${stem} 75 L ${left} 75 Z M ${stem} 35 L ${innerCenter} 35 C ${innerCenter + innerControl} 35, ${innerRight} ${50 - innerControl}, ${innerRight} 50 C ${innerRight} ${50 + innerControl}, ${innerCenter + innerControl} 65, ${innerCenter} 65 L ${stem} 65 Z`;
}

/** The archive's 500vh pinned rail, staggered letters, palette fade, and SVG progress. */
export function bindMethod(method: HTMLElement, reduced: boolean) {
  const rail = method.querySelector<HTMLElement>("[data-method-rail]");
  const track = method.querySelector<HTMLElement>("[data-method-track]");
  const intro = method.querySelector<HTMLElement>("[data-method-intro]");
  if (!rail || !track || !intro) return () => {};
  const slides = Array.from(
    track.querySelectorAll<HTMLElement>("[data-method-slide]"),
  );
  if (reduced) {
    const originalRailStyle = rail.getAttribute("style");
    const originalIntroStyle = intro.getAttribute("style");
    const progress = rail.querySelector<SVGSVGElement>(
      'svg[aria-label="method progress"]',
    )?.parentElement;
    const originalProgressStyle = progress?.getAttribute("style");
    rail.dataset.reducedMotion = "true";
    rail.style.height = "auto";
    rail.style.overflow = "visible";
    intro.style.display = "none";
    if (progress) progress.style.display = "none";
    const header = document.createElement("div");
    header.className = "px-8 pt-24 pb-12";
    const heading = document.createElement("h2");
    heading.className =
      "font-display text-display-l font-bold text-[var(--method-fg)]";
    heading.textContent = "The 5 method.";
    const subtitle = document.createElement("p");
    subtitle.className =
      "mt-3 font-mono text-[14px] uppercase tracking-[0.15em] text-[var(--method-fg)] opacity-35";
    subtitle.textContent = "five phases to evolve";
    header.append(heading, subtitle);
    rail.prepend(header);
    return () => {
      header.remove();
      delete rail.dataset.reducedMotion;
      if (originalRailStyle === null) rail.removeAttribute("style");
      else rail.setAttribute("style", originalRailStyle);
      if (originalIntroStyle === null) intro.removeAttribute("style");
      else intro.setAttribute("style", originalIntroStyle);
      if (progress) {
        if (originalProgressStyle == null) progress.removeAttribute("style");
        else progress.setAttribute("style", originalProgressStyle);
      }
    };
  }
  const splits: SplitText[] = [];
  const disposeSweep = bindMethodSweep(rail);
  const reveals = slides.map((slide, index) => {
    const name = slide.querySelector<HTMLElement>("[data-method-name]");
    const tagline = slide.querySelector<HTMLElement>("[data-method-tagline]");
    const bullets = Array.from(
      slide.querySelectorAll<HTMLElement>("[data-method-bullet]"),
    );
    const split = name
      ? SplitText.create(name, {
          type: "chars",
          charsClass: "inline-block will-change-transform",
        })
      : null;
    if (split) splits.push(split);
    if (name) gsap.set(name, { opacity: 1 });
    const chars = split?.chars ?? [];
    gsap.set(chars, { y: index ? 24 : 0, opacity: index ? 0 : 1 });
    if (tagline)
      gsap.set(tagline, { y: index ? 12 : 0, opacity: index ? 0 : 1 });
    gsap.set(bullets, { y: index ? 12 : 0, opacity: index ? 0 : 1 });
    return { chars, tagline, bullets };
  });
  const progressSvg = rail.querySelector<SVGSVGElement>(
    'svg[aria-label="method progress"]',
  );
  const progressRoot = progressSvg?.parentElement;
  const paths = progressSvg
    ? Array.from(progressSvg.querySelectorAll<SVGPathElement>(":scope > path"))
    : [];
  const labels = progressRoot
    ? Array.from(
        progressRoot.querySelectorAll<HTMLElement>(":scope > div > span"),
      )
    : [];
  const lines = progressSvg
    ? Array.from(progressSvg.querySelectorAll<SVGRectElement>(":scope > rect"))
    : [];
  const centers = [20, 195, 370, 545, 720];
  const svgElement = <T extends keyof SVGElementTagNameMap>(
    tag: T,
    attrs: Record<string, string>,
  ) => {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([name, value]) =>
      element.setAttribute(name, value),
    );
    return element;
  };
  const spark = svgElement("g", { "pointer-events": "none" });
  const defs = svgElement("defs", {});
  const gradient = svgElement("linearGradient", {
    id: "mp-spark-tail",
    x1: "0",
    y1: "0",
    x2: "1",
    y2: "0",
  });
  gradient.append(
    svgElement("stop", {
      offset: "0%",
      "stop-color": "var(--method-fg)",
      "stop-opacity": "0",
    }),
    svgElement("stop", {
      offset: "100%",
      "stop-color": "var(--method-fg)",
      "stop-opacity": "0.9",
    }),
  );
  defs.append(gradient);
  const tail = svgElement("rect", {
    y: "48.25",
    height: "3.5",
    rx: "1",
    fill: "url(#mp-spark-tail)",
  });
  const head = svgElement("circle", {
    cy: "50",
    r: "2.4",
    fill: "var(--method-fg)",
  });
  spark.append(defs, tail, head);
  progressSvg?.append(spark);
  const thresholds = [0.25, 0.43, 0.59, 0.76, 0.92];
  const visible = [true, false, false, false, false];
  let previousActive = -1;
  const foreground = gsap.utils.interpolate("#171717", "#F0F0F8");
  const border = gsap.utils.interpolate(
    "rgba(0,0,0,0.1)",
    "rgba(255,255,255,0.1)",
  );
  const ease = gsap.parseEase("power2.in");
  function update(progress: number) {
    let active = -1;
    thresholds.forEach((threshold, index) => {
      if (progress >= threshold) active = index;
    });
    reveals.forEach((reveal, index) => {
      if (!index) return;
      const show = progress >= thresholds[index];
      if (show === visible[index]) return;
      visible[index] = show;
      gsap.to(reveal.chars, {
        y: show ? 0 : 24,
        opacity: +show,
        duration: show ? 0.8 : 0.3,
        stagger: show ? 0.06 : 0,
        ease: show ? "expo.out" : "power3.in",
        overwrite: "auto",
      });
      if (reveal.tagline)
        gsap.to(reveal.tagline, {
          y: show ? 0 : 12,
          opacity: +show,
          duration: show ? 0.8 : 0.3,
          delay: show ? 0.15 : 0,
          ease: show ? "expo.out" : "power3.in",
          overwrite: "auto",
        });
      gsap.to(reveal.bullets, {
        y: show ? 0 : 12,
        opacity: +show,
        duration: show ? 0.8 : 0.3,
        delay: show ? 0.3 : 0,
        stagger: show ? 0.08 : 0,
        ease: show ? "expo.out" : "power3.in",
        overwrite: "auto",
      });
    });
    const palette = ease(Math.max(0, Math.min(1, (progress - 0.5) / 0.5)));
    const alpha = 1 - Math.max(0, Math.min(1, (progress - 0.95) / 0.05));
    method.style.setProperty(
      "--method-bg",
      `rgba(${Math.round(255 - 249 * palette)}, ${Math.round(255 - 247 * palette)}, ${Math.round(255 - 239 * palette)}, ${alpha})`,
    );
    method.style.setProperty("--method-fg", foreground(palette));
    method.style.setProperty("--method-border", border(palette));
    const shown = Math.max(0, Math.min(1, (progress - 0.15) / 0.1));
    if (progressRoot) {
      progressRoot.style.opacity = String(shown);
      progressRoot.style.transform = `translateX(-50%) translateY(${(1 - shown) * 14}px)`;
    }
    const reached =
      20 + Math.max(0, Math.min(1, (progress - 0.25) / 0.67)) * 700;
    spark.style.display = reached <= 23.5 || reached >= 716.5 ? "none" : "";
    const tailLength = Math.min(26, reached - 20);
    tail.setAttribute("x", String(reached - tailLength));
    tail.setAttribute("width", String(tailLength));
    head.setAttribute("cx", String(reached));
    lines.slice(4, 8).forEach((line, index) => {
      const from = centers[index] + 19,
        to = centers[index + 1] - 19;
      line.setAttribute(
        "width",
        String(Math.max(0, Math.min(reached, to) - from)),
      );
    });
    if (active !== previousActive) {
      paths.forEach((path, index) => {
        if (index <= active === index <= previousActive) return;
        const filled = index <= active;
        gsap.killTweensOf(path);
        gsap.to(path, {
          morphSVG: {
            shape: filled
              ? letter(centers[index], index === 4)
              : `${circle(centers[index], 50, 9)} ${circle(centers[index], 50, 0.4)}`,
            type: "rotational",
            shapeIndex: "auto",
          },
          scale: 1,
          duration: 0.7,
          ease: "power3.inOut",
        });
        if (labels[index])
          gsap.to(labels[index], {
            autoAlpha: +filled,
            y: filled ? 0 : 4,
            duration: 0.45,
            delay: filled ? 0.22 : 0,
            ease: "power2.out",
            overwrite: "auto",
          });
      });
      previousActive = active;
    }
  }
  gsap.set(intro, { opacity: 0, scale: 0.95 });
  const introMotion = gsap.timeline({
    scrollTrigger: {
      trigger: rail,
      start: "top bottom",
      end: "+=200%",
      scrub: 1.5,
    },
  });
  introMotion
    .to(intro, { opacity: 1, scale: 1, ease: "none", duration: 50 })
    .to(intro, { opacity: 1, scale: 1, duration: 35 })
    .to(intro, { opacity: 0, scale: 1.05, ease: "none", duration: 15 });
  const railMotion = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: rail,
      start: "top top",
      end: "+=500%",
      pin: true,
      scrub: 1.5,
      invalidateOnRefresh: true,
      onUpdate: (trigger) => update(trigger.progress),
    },
  });
  railMotion.fromTo(
    track,
    { x: () => window.innerWidth },
    { x: () => -2.65 * window.innerWidth, duration: 0.8 },
    0.2,
  );
  update(0);
  let idle: gsap.core.Tween | null = null;
  const wobbleProgress = () => {
    const candidates = paths
      .map((_, index) => index)
      .filter((index) => index > previousActive);
    if (candidates.length) {
      const index = candidates[Math.floor(Math.random() * candidates.length)];
      const x = centers[index],
        top = 9 * (1 + (Math.random() - 0.5) * 0.7),
        right = 9 * (1 + (Math.random() - 0.5) * 0.7),
        bottom = 9 * (1 + (Math.random() - 0.5) * 0.7),
        left = 9 * (1 + (Math.random() - 0.5) * 0.7),
        k = 0.5522847498;
      const shape = `M ${x - left} 50 C ${x - left} ${50 - left * k}, ${x - top * k} ${50 - top}, ${x} ${50 - top} C ${x + top * k} ${50 - top}, ${x + right} ${50 - right * k}, ${x + right} 50 C ${x + right} ${50 + right * k}, ${x + bottom * k} ${50 + bottom}, ${x} ${50 + bottom} C ${x - bottom * k} ${50 + bottom}, ${x - left} ${50 + left * k}, ${x - left} 50 Z ${circle(x, 50, 0.4)}`;
      gsap
        .timeline()
        .to(paths[index], {
          morphSVG: { shape, type: "rotational", shapeIndex: "auto" },
          scale: 1.6,
          svgOrigin: `${x} 50`,
          duration: 1.3,
          ease: "sine.inOut",
        })
        .to(paths[index], {
          morphSVG: {
            shape: `${circle(x, 50, 9)} ${circle(x, 50, 0.4)}`,
            type: "rotational",
            shapeIndex: "auto",
          },
          scale: 1,
          duration: 1.3,
          ease: "sine.inOut",
        });
    }
    idle = gsap.delayedCall(2.5 + 3 * Math.random(), wobbleProgress);
  };
  const progressObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !idle)
        idle = gsap.delayedCall(1.5 + 1.5 * Math.random(), wobbleProgress);
      else if (!entry.isIntersecting) {
        idle?.kill();
        idle = null;
      }
    }
  });
  if (progressRoot) progressObserver.observe(progressRoot);
  return () => {
    spark.remove();
    idle?.kill();
    progressObserver.disconnect();
    gsap.killTweensOf([...paths, ...labels]);
    disposeSweep();
    introMotion.scrollTrigger?.kill();
    introMotion.kill();
    railMotion.scrollTrigger?.kill();
    railMotion.kill();
    splits.forEach((split) => split.revert());
  };
}
