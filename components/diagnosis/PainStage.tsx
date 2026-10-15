"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import data from "./data.json";

type Category = keyof typeof data.categories;
type Pain = (typeof data.pains)[number];
type Keyword = { id: number; pain: Pain; x: number; y: number; visible: boolean };
const keywords: Record<string, string[]> = {
  performance: ["slow", "crash", "lag", "load", "speed", "perform", "down", "lent", "lenta", "cae", "caer", "carga", "velocidad", "rendimiento", "tarda"],
  marketing: ["ad", "ads", "marketing", "campaign", "leads", "conversion", "traffic", "anuncio", "publicidad", "campaña", "campana", "conversión", "trafico", "tráfico", "pauta"],
  sales: ["sale", "deal", "close", "pipeline", "quota", "revenue", "lead", "prospect", "venta", "vender", "cerrar", "cierre", "embudo", "ingresos", "prospecto", "cliente", "cotiza"],
  operations: ["spreadsheet", "manual", "process", "workflow", "tool", "operations", "team", "productive", "inventory", "headache", "growing", "hoja de calculo", "hoja de cálculo", "excel", "proceso", "flujo", "herramienta", "operacion", "operación", "equipo", "productiv", "inventario", "dolor de cabeza", "crecer", "creciendo", "escalar"],
  data: ["data", "numbers", "metric", "dashboard", "kpi", "track", "analyt", "report", "dato", "datos", "numero", "número", "metrica", "métrica", "tablero", "panel", "medir", "analit", "analít", "reporte", "informe"],
  support: ["support", "ticket", "customer service", "help desk", "drowning", "soporte", "atencion", "atención", "servicio al cliente", "mesa de ayuda", "saturad", "ahogad"],
};

function Scramble({ text }: { text: string }) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_\\/[]{}—=+*^?#";
    const start = performance.now();
    const interval = setInterval(() => {
      const elapsed = performance.now() - start;
      setDisplay(Array.from(text, (char, index) => char === " " || elapsed > index * 22 + 450 ? char : chars[Math.floor(Math.random() * chars.length)]).join(""));
      if (elapsed > text.length * 22 + 450) clearInterval(interval);
    }, 45);
    return () => clearInterval(interval);
  }, [text]);
  return <span aria-label={text}><span aria-hidden="true">{display}</span></span>;
}

/** Original stagger, lifetimes, exclusion zones, and farthest-candidate placement. */
function PainCloud({ enabled, frozen, copy, onSelect }: { enabled: boolean; frozen: boolean; copy: Record<string, string>; onSelect: (pain: Pain, target: HTMLButtonElement) => void }) {
  const [screen, setScreen] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [items, setItems] = useState<Keyword[]>([]);
  const frozenRef = useRef(frozen);
  useEffect(() => { frozenRef.current = frozen; }, [frozen]);
  useEffect(() => {
    const desktop = matchMedia("(min-width: 1024px)");
    const tablet = matchMedia("(min-width: 768px)");
    const update = () => setScreen(desktop.matches ? "desktop" : tablet.matches ? "tablet" : "mobile");
    update(); desktop.addEventListener("change", update); tablet.addEventListener("change", update);
    return () => { desktop.removeEventListener("change", update); tablet.removeEventListener("change", update); };
  }, []);
  useEffect(() => {
    if (!enabled || screen === "mobile") return;
    let stopped = false;
    let next = 0;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const schedule = (fn: () => void, delay: number) => {
      const timer = setTimeout(() => { timers.delete(timer); if (!stopped && !frozenRef.current) fn(); }, delay);
      timers.add(timer);
    };
    const tablet = screen === "tablet";
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const spawn = () => {
      const id = next++;
      setItems(previous => {
        let position = { x: 12, y: tablet ? 60 : 6 };
        let distance = -Infinity;
        for (let trial = 0; trial < 12; trial++) {
          const x = 8 + 84 * Math.random();
          const y = tablet ? Math.random() < .5 ? 60 + 15 * Math.random() : 78 + 16 * Math.random() : Math.random() < .5 ? 6 + 44 * Math.random() : 54 + 40 * Math.random();
          if (tablet ? x >= 10 && x <= 90 && y <= 60 : x >= 22 && x <= 78 && y >= 5 && y <= 52) continue;
          const nearest = previous.length ? Math.min(...previous.map(item => Math.hypot(item.x - x, (item.y - y) * 2.5))) : Infinity;
          if (nearest > distance) { distance = nearest; position = { x, y }; }
        }
        return [...previous, { id, pain: data.pains[id % data.pains.length], ...position, visible: reduced }];
      });
      schedule(() => setItems(previous => previous.map(item => item.id === id ? { ...item, visible: true } : item)), 50);
      if (reduced) return;
      schedule(() => {
        setItems(previous => previous.map(item => item.id === id ? { ...item, visible: false } : item));
        schedule(() => {
          setItems(previous => previous.filter(item => item.id !== id));
          schedule(spawn, 100 + Math.random() * 600);
        }, 600);
      }, 7000 + Math.random() * 4000);
    };
    setItems([]);
    Array.from({ length: tablet ? 5 : 9 }, (_, index) => schedule(spawn, reduced ? 0 : 400 + index * 500));
    return () => { stopped = true; timers.forEach(clearTimeout); };
  }, [enabled, screen]);
  if (screen === "mobile") return null;
  return <div className="pointer-events-none absolute inset-0" data-pain-cloud>{items.map(item => <button key={item.id} data-keyword="true" type="button" onClick={event => onSelect(item.pain, event.currentTarget)} disabled={frozen} style={{ position: "absolute", left: `${item.x}%`, top: `${item.y}%`, transform: "translate(-50%, -50%)", opacity: item.visible ? 1 : 0, transition: "opacity 600ms ease-out" }} className="pointer-events-auto group whitespace-nowrap font-mono text-body leading-none tracking-[-0.01em] text-fg/90 hover:text-fg will-change-transform"><span className="relative inline-block transition-transform duration-200 ease-out group-hover:scale-[1.12]"><Scramble text={copy[`pain_${item.pain.id}`] ?? item.pain.text}/><span className="absolute left-full top-0 ml-3 text-fg-muted">{item.pain.count} ↗</span></span></button>)}</div>;
}

export function PainStage({ copy, onSelect }: { copy: Record<string, string>; onSelect: (text: string, category: Category, count: number) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const transitioning = useRef(false);
  const transition = useRef<gsap.core.Timeline | null>(null);
  const [count, setCount] = useState(data.pains.reduce((total, pain) => total + pain.count, 0));
  const examples = useMemo(() => Array.from({ length: 5 }, (_, index) => copy[`s2aPromptExample${index + 1}`]), [copy]);
  useEffect(() => {
    if (value) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setPlaceholder(examples[0]); return; }
    let index = 0, length = 0, deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const example = examples[index];
      length += deleting ? -1 : 1;
      setPlaceholder(example.slice(0, length));
      let delay = deleting ? 24 : 55 + Math.random() * 35;
      if (length === example.length) { deleting = true; delay = 1500; }
      else if (!length) { deleting = false; index = (index + 1) % examples.length; delay = 280; }
      timer = setTimeout(tick, delay);
    };
    tick(); return () => clearTimeout(timer);
  }, [value, examples]);
  useEffect(() => {
    if (!root.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => { timer = setTimeout(() => { setCount(previous => Math.max(1, previous + (Math.random() < .8 ? 1 : -1))); tick(); }, 3000 + Math.random() * 2000); };
    const observer = new IntersectionObserver(([entry]) => { clearTimeout(timer); if (entry.isIntersecting) tick(); });
    observer.observe(root.current);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, []);
  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setEnabled(true); return; }
    gsap.registerPlugin(ScrollTrigger, SplitText);
    let timeline: gsap.core.Timeline;
    const context = gsap.context(() => {
      const title = SplitText.create(scope.querySelector("[data-journey-title]")!, { type: "words", wordsClass: "inline-block" });
      const subhead = SplitText.create(scope.querySelector("[data-subhead]")!, { type: "words", wordsClass: "inline-block" });
      const parts = scope.querySelectorAll("[data-eyebrow], [data-liveheader], [data-form]");
      const reveal = () => {
        timeline?.kill();
        gsap.set([...title.words, ...subhead.words], { opacity: 0, filter: "blur(10px)" });
        gsap.set(parts, { autoAlpha: 0, y: 16 });
        timeline = gsap.timeline();
        timeline.to(parts[0], { autoAlpha: 1, y: 0, duration: .9, ease: "expo.out" }, 0)
          .to(title.words, { opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "expo.out", stagger: { amount: 1.2 } }, 0)
          .to(subhead.words, { opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "expo.out", stagger: { amount: 1.2 } }, 1.2)
          .to(parts[1], { autoAlpha: 1, y: 0, duration: .9, ease: "expo.out" }, 2)
          .to(parts[2], { autoAlpha: 1, y: 0, duration: .6, ease: "expo.out" }, 2.2)
          .call(() => setEnabled(true), undefined, 2.8);
      };
      const trigger = ScrollTrigger.create({ trigger: scope, start: "top 80%", onEnter: reveal, onEnterBack: reveal });
      return () => { trigger.kill(); timeline?.kill(); title.revert(); subhead.revert(); };
    }, scope);
    return () => { context.revert(); transition.current?.kill(); };
  }, []);
  const select = (text: string, category: Category, cases: number, target?: HTMLButtonElement) => {
    if (transitioning.current) return;
    transitioning.current = true; setFrozen(true);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { onSelect(text, category, cases); return; }
    const scope = root.current!;
    const others = Array.from(scope.querySelectorAll("[data-keyword]")).filter(item => item !== target);
    const timeline = gsap.timeline({ onComplete: () => onSelect(text, category, cases) });
    transition.current = timeline;
    if (target) {
      const rect = target.getBoundingClientRect();
      const top = scope.closest("section")!.getBoundingClientRect().top;
      gsap.set(target, { zIndex: 30 });
      timeline.to(target, { scale: 1.15, duration: .2, ease: "expo.out" }, 0)
        .to(target, { scale: 1, duration: .2, ease: "expo.out" }, .2)
        .to(target, { x: innerWidth / 2 - (rect.left + rect.width / 2), y: top + 90 - (rect.top + rect.height / 2), scale: 20 / 15, duration: .7, ease: "expo.inOut" }, .4);
      if (others.length) timeline.to(others, { opacity: .15, duration: .4 }, 0);
    }
    if (others.length) timeline.to(others, { opacity: 0, duration: target ? .5 : .4, ease: "power3.in" }, target ? .4 : 0);
    timeline.to(scope.querySelector("[data-pain-content]"), { opacity: 0, y: -30, duration: .5, ease: "power3.in" }, target ? .4 : .1);
  };
  const submit = () => {
    const text = value.trim();
    if (!text) return;
    const exact = data.pains.find(pain => pain.text === text || copy[`pain_${pain.id}`] === text);
    const category = exact?.category ?? Object.entries(keywords).find(([, words]) => words.some(word => text.toLowerCase().includes(word)))?.[0] ?? "general";
    select(text, category as Category, exact?.count ?? 1);
  };
  return <div ref={root} className="relative px-4 pt-16 pb-20 sm:min-h-screen sm:px-6 sm:pt-20 sm:pb-24">
    <div data-pain-content className="pointer-events-none relative z-10 flex flex-col items-center gap-6 text-center will-change-transform">
      <span data-eyebrow className="font-mono text-label uppercase tracking-[0.28em] text-fg-muted">{copy.s2aEyebrow}</span>
      <h2 data-journey-title className="font-display text-display-l font-extrabold text-fg will-change-transform">{copy.s2aHeadline}</h2>
      <p data-subhead className="max-w-[480px] font-mono text-body text-fg">{copy.s2aSubLine1}<br/>{copy.s2aSubLine2}</p>
      <div data-liveheader className="mt-2"><div className="flex items-center gap-3"><span className="inline-flex items-center gap-2 rounded-full border-hairline px-3 py-1.5 font-mono text-label-s uppercase text-fg-secondary"><span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"/>{copy.liveLabel}</span><span className="sr-only">{copy.liveSrLabel.replace("{count}", "183")}</span><p aria-hidden="true" className="flex items-baseline gap-2 font-mono text-body text-fg-muted"><span className="text-label-l tabular-nums text-fg">{count}</span><span className="text-fg-muted/60">·</span><span>{copy.frictionsDiagnosed}</span></p></div></div>
      <div data-form className="pointer-events-auto mt-6 w-full max-w-[420px]"><form onSubmit={event => { event.preventDefault(); submit(); }} className="group flex w-full items-center gap-3 rounded-[10px] px-5 py-4 border-hairline bg-white/[0.02] backdrop-blur-md transition-colors duration-200 ease-out focus-within:border-hairline-strong focus-within:bg-white/[0.035]"><input value={value} disabled={frozen} onChange={event => setValue(event.target.value)} placeholder={placeholder} aria-label={copy.promptBoxAria} className="flex-1 min-w-0 bg-transparent font-mono text-[14px] text-fg placeholder:text-fg-muted outline-none disabled:opacity-60"/><button disabled={!value.trim() || frozen} aria-label={copy.promptBoxSubmitAria} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-accent hover:bg-accent/10 disabled:opacity-40">→</button></form></div>
    </div>
    <PainCloud enabled={enabled} frozen={frozen} copy={copy} onSelect={(pain, target) => select(copy[`pain_${pain.id}`] ?? pain.text, pain.category as Category, pain.count, target)}/>
  </div>;
}
