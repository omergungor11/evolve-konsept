"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { DiagnosisCloud } from "./DiagnosisCloud";

type Service = { slug: string; name: string; cases: number };

/** The original full-screen matched-services cloud and locked portfolio reveal. */
export function DiagnosisPreview({ name, pain, line, matched, copy, locale, onContinue }: { name: string; pain: string; line: string; matched: Service[]; copy: Record<string, string>; locale: string; onContinue: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [exiting, setExiting] = useState(false);
  const next = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const exitAnimation = useRef<gsap.core.Tween | null>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(SplitText);
    const splits: SplitText[] = [];
    const context = gsap.context(() => {
      const reveal = (selector: string, delay: number) => {
        const element = root.current?.querySelector<HTMLElement>(selector);
        if (!element) return;
        const split = SplitText.create(element, { type: "words", wordsClass: "inline-block" });
        splits.push(split);
        gsap.fromTo(split.words, { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "expo.out", stagger: { amount: 1.2 }, delay });
      };
      reveal("[data-2b-greeting]", .2); reveal("[data-2b-painref]", .8); reveal("[data-2b-line]", 3.2);
      reveal("[data-2b-cases-label]", 4); reveal("[data-2b-scroll-label]", 5.2);
      gsap.fromTo("[data-2b-portfolio]", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .7, ease: "expo.out", delay: 4.3 });
      gsap.fromTo("[data-2b-scroll-arrow-wrap]", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .6, ease: "expo.out", delay: 5.2 });
      gsap.to("[data-2b-scroll-arrow]", { y: 6, repeat: -1, yoyo: true, duration: 1.2, ease: "sine.inOut", delay: 5.8 });
      gsap.fromTo("[data-2b-cta]", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .7, ease: "expo.out", delay: 8.5 });
    }, root);
    return () => { clearTimeout(next.current); exitAnimation.current?.kill(); context.revert(); splits.forEach(split => split.revert()); };
  }, []);
  const proceed = () => {
    if (exiting) return;
    setExiting(true);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { onContinue(); return; }
    exitAnimation.current = gsap.to(root.current?.querySelectorAll("[data-2b-greeting], [data-2b-painref], [data-2b-line], [data-2b-cta], [data-2b-scroll-hint], [data-2b-cases-label], [data-2b-portfolio]") ?? [], { x: innerWidth + 200, duration: 1.2, ease: "power3.in", stagger: .07 });
    next.current = setTimeout(onContinue, 2600);
  };
  return <div ref={root} className="relative z-10">
    <section className="relative h-screen w-full">
      <div className="absolute inset-0 z-0"><DiagnosisCloud matched={matched} exiting={exiting} casesLabel={locale === "es" ? "casos" : "cases"}/></div>
      <div className="relative z-10 flex flex-col items-center gap-5 px-6 pt-24 text-center">
        <h2 data-2b-greeting className="font-display text-display-l font-extrabold text-fg">{name}.</h2>
        <p data-2b-painref className="max-w-[640px] font-mono text-body text-fg">{copy.s2bPainrefPrefix}“{pain}”{copy.s2bPainrefSuffix}</p>
        <p data-2b-line className="max-w-[640px] text-center font-mono text-body text-fg">{line}</p>
        <button data-2b-cta className="mt-2 rounded-full border-hairline-strong px-6 py-3 font-mono text-body-sm hover:bg-white/[0.04]" disabled={exiting} onClick={proceed}>{copy.s2bBreakdownButton} →</button>
      </div>
      <div data-2b-scroll-hint aria-hidden="true" className="pointer-events-none absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"><span data-2b-scroll-label className="font-mono text-body text-fg">{copy.scrollHint}</span><span data-2b-scroll-arrow-wrap><span data-2b-scroll-arrow className="inline-block text-fg">↓</span></span></div>
    </section>
    <section className="relative flex w-full flex-col items-center gap-5 px-6 pb-24 pt-16">
      <p data-2b-cases-label className="font-mono text-body text-fg">{copy.s2bCasesLabel}</p>
      <div data-2b-portfolio className="diagnosis-cases-slider flex w-full max-w-[900px] snap-x snap-mandatory gap-4 overflow-x-auto px-2">{["001", "002", "003"].map(id => <div key={id} className="shrink-0 snap-start"><div aria-disabled="true" className="relative flex h-[140px] w-[200px] cursor-not-allowed flex-col justify-end overflow-hidden rounded-[12px] border-hairline bg-white/[0.04]"><div aria-hidden="true" className="absolute inset-0 opacity-50" style={{ background: "linear-gradient(135deg, rgba(228,0,124,0.18) 0%, rgba(78,255,239,0.10) 50%, rgba(228,0,124,0.06) 100%)", filter: "blur(8px)" }}/><div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full border-hairline bg-black/50 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-fg-muted backdrop-blur-md"><span aria-hidden="true">⊘</span>{copy.lockedBadge}</div><div className="relative z-10 px-4 pb-3 font-mono text-[12px] text-fg-secondary">{copy.caseTitle.replace("{id}", id)}</div></div></div>)}</div>
    </section>
  </div>;
}
