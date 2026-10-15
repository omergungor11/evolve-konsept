"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/** The reference's 22px dot grid and click-driven expanding waves. */
export function DotField() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    let width = 0, height = 0, ticking = false;
    let waves: Array<{ x: number; y: number; start: number }> = [];
    const render = () => {
      const now = performance.now() / 1000;
      waves = waves.filter(wave => now - wave.start < 2.2);
      context.clearRect(0, 0, width, height);
      for (let row = 11; row < height; row += 22) {
        for (let column = 11; column < width; column += 22) {
          let x = column, y = row, alpha = 0.09;
          for (const wave of waves) {
            const age = now - wave.start;
            const dx = column - wave.x, dy = row - wave.y;
            const distance = Math.hypot(dx, dy);
            const offset = distance - 380 * age;
            if (Math.abs(offset) >= 80) continue;
            const strength = Math.cos(offset / 80 * Math.PI * 0.5);
            const inverse = distance > 0.001 ? 1 / distance : 0;
            const fade = 1 - age / 2.2;
            x += dx * inverse * strength * 14 * fade;
            y += dy * inverse * strength * 14 * fade;
            alpha += 0.28 * fade * Math.max(0, strength);
          }
          context.fillStyle = `rgba(255,255,255,${Math.min(1, alpha)})`;
          context.beginPath();
          context.arc(x, y, 1, 0, Math.PI * 2);
          context.fill();
        }
      }
      if (!waves.length && ticking) {
        gsap.ticker.remove(render);
        ticking = false;
      }
    };
    const resize = () => {
      width = innerWidth; height = innerHeight;
      const ratio = devicePixelRatio || 1;
      element.width = Math.floor(width * ratio);
      element.height = Math.floor(height * ratio);
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      render();
    };
    const click = (event: MouseEvent) => {
      if ((event.target as Element)?.closest('a,button,[role="button"],input,textarea,select,[data-cursor-hover]')) return;
      if (waves.length >= 6) waves.shift();
      waves.push({ x: event.clientX, y: event.clientY, start: performance.now() / 1000 });
      if (!ticking) { ticking = true; gsap.ticker.add(render); }
    };
    resize();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) window.addEventListener("click", click);
    window.addEventListener("resize", resize);
    return () => {
      gsap.ticker.remove(render);
      window.removeEventListener("click", click);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[-2]"><canvas ref={canvas} className="h-full w-full" /></div>;
}
