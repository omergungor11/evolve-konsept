"use client";

// Original diagnosis cloud motion, projected with the archived 75° camera at z=500.
// Canvas draws the additive discs; regular DOM keeps service labels accessible.
import { useEffect, useRef, useState } from "react";

type Service = { slug: string; name: string; cases: number };
type Point = { x: number; y: number; z: number };
const random = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
const bend = () => random(40, 130) * (Math.random() < 0.5 ? 1 : -1);

function matchedPositions(count: number): Point[] {
  const arc = Math.min(2 * Math.PI, Math.PI + Math.PI / 3 * Math.max(0, count - 3));
  const start = 3 * Math.PI / 2 - arc / 2;
  const outer = Math.min(Math.max(220, 115 / Math.sin(arc / (2 * Math.max(count, 2))) * 1.15), 380);
  const inner = Math.max(100, 0.55 * outer);
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    let best = { x: 0, y: 0, z: 0 }, bestDistance = -Infinity;
    for (let attempt = 0; attempt < 32; attempt++) {
      const angle = start + Math.random() * arc, radius = random(inner, outer);
      const point = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, z: random(-15, 15) };
      const distance = points.length ? Math.min(...points.map((p) => Math.hypot(p.x - point.x, p.y - point.y))) : Infinity;
      if (distance > bestDistance) { bestDistance = distance; best = point; }
    }
    points.push(best);
  }
  return points;
}

function CloudLabel({ service, exiting, delay, casesLabel }: { service: Service; exiting: boolean; delay: number; casesLabel: string }) {
  const [cases, setCases] = useState(service.cases);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setRevealed(true); return; }
    const reveal = window.setTimeout(() => setRevealed(true), delay);
    let timer = 0;
    const tick = () => {
      timer = window.setTimeout(() => {
        setCases((value) => Math.max(1, value + (Math.random() < 0.7 ? 1 : -1)));
        tick();
      }, 4000 + Math.floor(2000 * Math.random()));
    };
    tick();
    return () => { clearTimeout(reveal); clearTimeout(timer); };
  }, [delay]);
  return <button type="button" data-cursor-hover tabIndex={revealed && !exiting ? 0 : -1}
    style={{ opacity: exiting ? 1 : Number(revealed), transform: exiting ? "translateX(2000px)" : revealed ? "translateY(0)" : "translateY(12px)", transition: "opacity 600ms var(--ease-out, ease-out), transform 1200ms cubic-bezier(0.55, 0, 0.99, 1), background-color 200ms ease", whiteSpace: "nowrap" }}
    className="group flex items-center gap-3 rounded-full border-hairline bg-white/[0.02] px-5 py-2.5 font-mono text-[13px] hover:bg-white/[0.04]">
    <span className="text-fg-muted transition-colors group-hover:text-[var(--color-accent-2,_#4EFFEF)]">[+]</span>
    <span className="text-fg">{service.name}</span><span className="text-fg-muted">·</span>
    <span className="tabular-nums text-fg-muted">{cases} {casesLabel}</span>
  </button>;
}

export function DiagnosisCloud({ matched, exiting = false, casesLabel = "cases" }: { matched: Service[]; exiting?: boolean; casesLabel?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const exit = useRef(exiting);
  useEffect(() => { exit.current = exiting; }, [exiting]);
  const serviceKey = matched.map((service) => service.slug).join("|");
  const count = matched.length;
  useEffect(() => {
    const element = container.current, surface = canvas.current;
    if (!element || !surface) return;
    const context = surface.getContext("2d");
    if (!context) return;
    const positions = matchedPositions(count);
    const noise = Array.from({ length: 160 }, () => {
      const radius = 320 * Math.random() ** 0.6, angle = Math.random() * Math.PI * 2;
      return {
        targetX: Math.cos(angle) * radius, targetY: Math.sin(angle) * radius, targetZ: random(-25, 25),
        startX: -1500 - 400 * Math.random(), startY: random(-240, 240), curve: bend(),
        entryDelay: Math.random() * 1.4, entryDuration: random(2.2, 3.8),
        freqX: random(1.2, 3.6), freqY: random(1.2, 3.6), freqZ: random(1, 2.8),
        phaseX: random(0, Math.PI * 2), phaseY: random(0, Math.PI * 2), phaseZ: random(0, Math.PI * 2),
        jiggleAmp: random(0.6, 1.8), jiggleFreq: random(0.6, 2),
        exitX: random(1500, 2000), exitDelay: Math.random() * 0.7, exitDuration: random(1.2, 1.7),
      };
    });
    const markers = [{ x: 0, y: 0, z: 0 }, ...positions].map((point, index) => ({
      ...point, core: index === 0 ? 6 : 4, halo: index === 0 ? 10 : 7,
      pulse: index === 0 ? 2.4 : 2.2 + (index - 1) % 3 * 0.15,
      delay: index === 0 ? 2.5 : 3.5 + (index - 1) * Math.min(0.18, 1.4 / Math.max(count - 1, 1)),
      exitDelay: Math.random() * 0.35, exitX: random(1500, 2000), curve: bend(), exitDuration: random(1.2, 1.7),
    }));
    let width = 1, height = 1, ratio = 1, frame = 0;
    const resize = () => {
      width = Math.max(1, element.clientWidth); height = Math.max(1, element.clientHeight);
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(width * ratio); surface.height = Math.round(height * ratio);
    };
    resize();
    const observer = new ResizeObserver(resize); observer.observe(element);
    const started = performance.now();
    let exitStart: number | null = null;
    const project = (x: number, y: number, z: number) => {
      const scale = height / 2 / Math.tan(75 * Math.PI / 360) / (500 - z);
      return { x: width / 2 + x * scale, y: height / 2 - y * scale, scale };
    };
    const disc = (x: number, y: number, z: number, radius: number, opacity = 1) => {
      const p = project(x, y, z);
      if (radius <= 0 || opacity <= 0) return;
      context.globalAlpha = opacity;
      context.beginPath(); context.arc(p.x, p.y, radius * p.scale, 0, Math.PI * 2); context.fill();
    };
    const render = (now: number) => {
      const time = (now - started) / 1000;
      if (exit.current && exitStart === null) exitStart = time;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";
      context.fillStyle = "white";
      for (const p of noise) {
        const exitTime = exitStart === null ? -1 : time - exitStart - p.exitDelay;
        if (exitTime >= 0) {
          const raw = exitTime / p.exitDuration;
          if (raw >= 1) continue;
          const progress = ease(raw), decay = (1 - raw) ** 2;
          disc(p.targetX + (p.exitX - p.targetX) * progress + 32 * decay * Math.sin(time * p.freqX + p.phaseX),
            p.targetY + Math.sin(progress * Math.PI) * p.curve + 28 * decay * Math.cos(time * p.freqY + p.phaseY),
            p.targetZ + 16 * decay * Math.sin(time * p.freqZ + p.phaseZ), 1.4);
          continue;
        }
        if (time < p.entryDelay) continue;
        const raw = clamp((time - p.entryDelay) / p.entryDuration), progress = ease(raw), decay = (1 - raw) ** 2;
        const targetX = p.targetX + Math.sin(time * p.jiggleFreq + p.phaseX) * p.jiggleAmp;
        const targetY = p.targetY + Math.cos(time * p.jiggleFreq * 1.13 + p.phaseY) * p.jiggleAmp;
        disc(p.startX + (targetX - p.startX) * progress + 32 * decay * Math.sin(time * p.freqX + p.phaseX),
          p.startY + (targetY - p.startY) * progress + Math.sin(progress * Math.PI) * p.curve + 28 * decay * Math.cos(time * p.freqY + p.phaseY),
          p.targetZ * progress + 16 * decay * Math.sin(time * p.freqZ + p.phaseZ), 1.4);
      }
      for (const p of markers) {
        let x = p.x, y = p.y, scale = 1;
        if (exitStart !== null) {
          const raw = (time - exitStart - p.exitDelay) / p.exitDuration;
          if (raw >= 1) continue;
          const progress = ease(clamp(raw)); x += p.exitX * progress; y += Math.sin(progress * Math.PI) * p.curve;
        } else { const progress = clamp((time - p.delay) / 0.8); scale = progress * progress * (3 - 2 * progress); }
        const pulse = time / p.pulse % 1;
        disc(x, y, p.z, p.halo * (1 + pulse * 2) * scale, 0.65 * (1 - pulse));
        disc(x, y, p.z, p.core * scale);
      }
      positions.forEach((point, index) => {
        const label = labels.current[index];
        if (!label) return;
        const p = project(point.x, point.y - 45, point.z);
        label.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;
      });
      if (exitStart === null || time - exitStart < 2.5) frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [serviceKey, count]);
  const stagger = Math.min(0.18, 1.4 / Math.max(count - 1, 1));
  return <div ref={container} className="relative h-screen w-full">
    <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
    {matched.map((service, index) => <div key={service.slug} ref={(element) => { labels.current[index] = element; }} style={{ position: "absolute", top: 0, left: 0 }}>
      <CloudLabel service={service} exiting={exiting} casesLabel={casesLabel} delay={(3.5 + index * stagger + 0.2) * 1000} />
    </div>)}
  </div>;
}
