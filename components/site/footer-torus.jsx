"use client";
// Preserves the original particle geometry, pointer interactions, and falling
// physics using regular React and Matter imports rather than archived bundles.
import * as t from "react/jsx-runtime";
import * as n from "react";
import Matter from "matter-js";
const o = { default: Matter };
const i = {
  prefersReducedMotion: () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};
const r = (2 * Math.PI) / 11;
const a = 2 * Math.PI;
export const FooterTorus = function (e) {
  let {
      ballCount: s = 1800,
      mobileBallCount: l = 1e3,
      ballRadius: c = 0.77,
      color: u = "rgba(240, 240, 248, 0.9)",
      cyanColor: d = "rgba(0, 229, 255, 0.85)",
      rosaColor: p = "rgba(228, 0, 124, 1)",
      cyanCount: f = 4,
      figureCenterY: m = 0.5,
      mobileFigureCenterY: v = 0.28,
      mobileAnchorSelector: y = "[data-torus-mobile-anchor]",
      figureScale: g = 0.13,
      mobileFigureScale: h = 0.33,
    } = e,
    x = (0, n.useRef)(null);
  return (
    (0, n.useEffect)(() => {
      let e = x.current;
      if (!e) return;
      let t = e.parentElement;
      if (!t) return;
      let n = e.getContext("2d");
      if (!n) return;
      let b = (e) => {
          let t = globalThis.document.createElement("canvas");
          ((t.width = 64), (t.height = 64));
          let n = t.getContext("2d");
          if (!n) return null;
          let o = n.createRadialGradient(32, 32, 0, 32, 32, 32);
          return (
            o.addColorStop(0, "rgba(255,255,255,1)"),
            o.addColorStop(0.28, "rgba(255,255,255,1)"),
            o.addColorStop(0.5, "rgba(255,255,255,0.7)"),
            o.addColorStop(0.72, "rgba(255,255,255,0.28)"),
            o.addColorStop(0.88, "rgba(255,255,255,0.07)"),
            o.addColorStop(1, "rgba(255,255,255,0)"),
            (n.fillStyle = o),
            n.fillRect(0, 0, 64, 64),
            (n.globalCompositeOperation = "source-in"),
            (n.fillStyle = e),
            n.fillRect(0, 0, 64, 64),
            t
          );
        },
        w = { white: b(u), cyan: b(d), rosa: b(p) },
        S = (0, i.prefersReducedMotion)(),
        A = globalThis.window.matchMedia("(max-width: 767px)").matches,
        M = globalThis.window.matchMedia(
          "(hover: hover) and (pointer: fine)",
        ).matches,
        P = A ? l : s,
        B = A ? h : g,
        C = A ? v : m,
        _ = Math.min(globalThis.window.devicePixelRatio || 1, 2),
        k = 0,
        I = 0,
        T = 0,
        R = 0,
        E = 0,
        D = 0,
        L = 0,
        F = 0,
        V = 0,
        O = "spinning",
        q = o.default.Engine.create({ gravity: { x: 0, y: 1, scale: 22e-5 } }),
        H = q.world,
        U = [],
        W = [],
        j = !1,
        N = -1e6,
        G = -1e6,
        z = 0,
        X = !1,
        Y = 0,
        Q = !1,
        $ = !0,
        J = 0,
        Z = 0.32 * !S,
        K = 0.32 * !S,
        ee = !1,
        et = !1,
        en = 0,
        eo = 0,
        ei = 0,
        er = 0,
        ea = (e) => {
          let t = (e * r) % a,
            n = S ? 0 : Math.min(1, Math.max(0, (e - 2.2) / 1.5));
          for (let o of W) {
            let i = o.torus,
              r = i.u0 + J + e * i.speedJitter,
              s = Math.cos(i.v),
              l = Math.sin(i.v),
              c = T + R * s * (1 + i.radialJitter),
              u = c * Math.cos(r),
              d = c * Math.sin(r),
              p = R * l,
              f = 0.8525245220595057 * p - 0.5226872289306592 * d,
              m = L + (0.5226872289306592 * p + 0.8525245220595057 * d),
              v = m > 1 ? L / m : L,
              y = E + u * v,
              g = D - f * v,
              h = Math.min(1, Math.max(0, (v - 0.55) / 0.9));
            ((o.depthAlpha = 0.28 + 0.72 * h), (o.depthSize = 0.7 + 0.4 * h));
            let x = t - (((r % a) + a) % a);
            (x < 0 && (x += a), (o.beamBoost = Math.exp(-(5.5 * x)) * n));
            let b = S ? 1 : (e - o.entry.entryDelay) / o.entry.entryDuration,
              w = b < 0 ? 0 : b > 1 ? 1 : b,
              A = w >= 1 ? 1 : 1 - Math.pow(2, -10 * w),
              M = o.entry.startX + (y - o.entry.startX) * A,
              P = o.entry.startY + (g - o.entry.startY) * A;
            P += Math.sin(A * Math.PI) * o.entry.curveAmount;
            let B = (1 - w) * (1 - w);
            if (
              ((M +=
                32 *
                B *
                Math.sin(e * o.entry.wobbleFreqX + o.entry.wobblePhaseX)),
              (P +=
                28 *
                B *
                Math.cos(e * o.entry.wobbleFreqY + o.entry.wobblePhaseY)),
              !ee && w > 0.6 && N > -1e5)
            ) {
              let e = M - N,
                t = P - G,
                n = e * e + t * t;
              if (n < 6400 && n > 0.01) {
                let o = Math.sqrt(n),
                  i = 1 - o / 80,
                  r = i * i * 30;
                ((M += (e / o) * r), (P += (t / o) * r));
              }
            }
            ((o.x = M), (o.y = P));
          }
        },
        es = () => {
          (U.length > 0 && o.default.World.remove(H, U),
            (U = [
              o.default.Bodies.rectangle(-100, I / 2, 200, 4 * I, {
                isStatic: !0,
              }),
              o.default.Bodies.rectangle(k + 100, I / 2, 200, 4 * I, {
                isStatic: !0,
              }),
              o.default.Bodies.rectangle(k / 2, I + 100, 4 * k, 200, {
                isStatic: !0,
              }),
            ]),
            o.default.World.add(H, U));
        },
        el = (e, t) => e >= E - F && e <= E + F && t >= D - V && t <= D + V,
        ec = (e) => {
          let n = t.getBoundingClientRect();
          ((N = e.clientX - n.left),
            (G = e.clientY - n.top),
            M &&
              "spinning" === O &&
              (t.style.cursor = ee ? "grabbing" : el(N, G) ? "grab" : ""));
        },
        eu = () => {
          ((N = -1e6), (G = -1e6), M && (t.style.cursor = ""));
        },
        ed = (e) => {
          if (0 === e.touches.length) return;
          let n = t.getBoundingClientRect();
          ((N = e.touches[0].clientX - n.left),
            (G = e.touches[0].clientY - n.top));
        },
        ep = () => {
          ((N = -1e6), (G = -1e6));
        },
        ef = (e) => {
          if ("spinning" !== O || ee) return;
          let n = t.getBoundingClientRect(),
            o = e.clientX - n.left,
            i = e.clientY - n.top;
          el(o, i) &&
            ((ee = !0),
            (et = !1),
            (eo = o),
            (ei = i),
            (en = o),
            (Z = 0),
            (t.style.cursor = "grabbing"),
            eA());
        },
        em = (e) => {
          if (!ee) return;
          let n = t.getBoundingClientRect(),
            o = e.clientX - n.left,
            i = e.clientY - n.top,
            r = o - en;
          ((en = o),
            (J += 0.006 * r),
            (Z = Math.max(-3, Math.min(3, 0.006 * r * 60))),
            (Math.abs(o - eo) > 5 || Math.abs(i - ei) > 5) && (et = !0));
        },
        ev = () => {
          ee &&
            ((ee = !1),
            M && "spinning" === O && (t.style.cursor = el(N, G) ? "grab" : ""));
        },
        ey = (e) => {
          if ("spinning" !== O) return;
          if (et) {
            et = !1;
            return;
          }
          let n = t.getBoundingClientRect();
          el(e.clientX - n.left, e.clientY - n.top) &&
            ((t.style.cursor = ""),
            (() => {
              if ("spinning" !== O) return;
              ((O = "falling"), es());
              let e = [];
              for (let t of W) {
                let n = o.default.Bodies.circle(t.x, t.y, c, {
                  restitution: 0.25,
                  friction: 0.05,
                  frictionAir: 0.012,
                  density: 0.0012,
                  slop: 0.02,
                });
                (o.default.Body.setVelocity(n, {
                  x: (Math.random() - 0.5) * 2,
                  y: 0.4 + 1.6 * Math.random(),
                }),
                  (t.body = n),
                  e.push(n));
              }
              (o.default.World.add(H, e), eA());
            })());
        },
        eg = (e, t) => {
          let o = w[e];
          if (o) {
            for (let i of W)
              if (i.color === e)
                if ("spinning" === O) {
                  let e = S
                      ? 1
                      : 0.84 +
                        0.16 * Math.sin(1.1 * t + 2 * i.entry.wobblePhaseX),
                    r = i.depthAlpha * e + 0.55 * i.beamBoost;
                  n.globalAlpha = r > 1 ? 1 : r;
                  let a = c * i.depthSize * (1 + 0.4 * i.beamBoost) * 2.2;
                  n.drawImage(o, i.x - a, i.y - a, 2 * a, 2 * a);
                } else {
                  n.globalAlpha = 1;
                  let e = 2.2 * c;
                  n.drawImage(o, i.x - e, i.y - e, 2 * e, 2 * e);
                }
            n.globalAlpha = 1;
          }
        },
        eh = (e) => {
          (n.clearRect(0, 0, k, I),
            (n.globalCompositeOperation = "lighter"),
            eg("white", e),
            eg("cyan", e),
            eg("rosa", e),
            (n.globalCompositeOperation = "source-over"));
        },
        ex = () => {
          let e = (globalThis.performance.now() - z) / 1e3,
            t = Math.min(Math.max(e - er, 0), 0.05);
          if (((er = e), "spinning" === O))
            (ee || (Z += (K - Z) * (1 - Math.exp(-(1.6 * t)))),
              (J += Z * t),
              ea(e));
          else {
            for (let e of W) {
              if (!e.body) continue;
              let t = e.body.position.x - N,
                n = e.body.position.y - G,
                i = t * t + n * n;
              if (i < 4225 && i > 0.01) {
                let r = Math.sqrt(i),
                  a = 1 - r / 65;
                o.default.Body.applyForce(e.body, e.body.position, {
                  x: (t / r) * 0.0045 * a,
                  y: (n / r) * 0.0045 * a,
                });
              }
            }
            for (let e of (o.default.Engine.update(q, 1e3 / 60), W))
              e.body && ((e.x = e.body.position.x), (e.y = e.body.position.y));
          }
          if ((eh(e), S && "spinning" === O && !ee)) {
            X = !1;
            return;
          }
          Y = globalThis.window.requestAnimationFrame(ex);
        },
        eb = 0,
        ew = 0,
        eS = () => {
          let o = t.getBoundingClientRect(),
            i = o.width,
            r = o.height;
          if (0 === i || 0 === r) return;
          let s = globalThis.window.innerWidth,
            l = globalThis.window.innerHeight,
            c = s !== eb || l !== ew,
            u = 0 === D;
          ((eb = s),
            (ew = l),
            (k = i),
            (I = r),
            (e.width = Math.floor(k * _)),
            (e.height = Math.floor(I * _)),
            (e.style.width = `${k}px`),
            (e.style.height = `${I}px`),
            n.setTransform(1, 0, 0, 1, 0, 0),
            n.scale(_, _),
            (R = 0.38 * (T = Math.min(k * B, 180))));
          let d = (T + R) * 0.5226872289306592 + 0.8525245220595057 * R,
            p = I * (A ? 0.7 : 0.55);
          if (d > p) {
            let e = p / d;
            ((T *= e), (R *= e));
          }
          if (
            ((L = (T + R) * 2.5),
            (F = (T + R) * 1.25 + 20),
            (V =
              ((T + R) * 0.5226872289306592 + 0.8525245220595057 * R) * 1.25 +
              20),
            (E = k / 2),
            u || c)
          ) {
            let e = I * C;
            if (A && y) {
              let n = t.querySelector(y);
              if (n) {
                let o = t.getBoundingClientRect(),
                  i = n.getBoundingClientRect();
                e = i.top - o.top + i.height / 2;
              }
            }
            D = e;
          }
          (j ||
            (() => {
              let e = Array(P).fill("white");
              if (f > 0) {
                e[Math.floor(Math.random() * P)] = "rosa";
                let t = 0;
                for (; t < f; ) {
                  let n = Math.floor(Math.random() * P);
                  "white" === e[n] && ((e[n] = "cyan"), t++);
                }
              }
              W = [];
              for (let t = 0; t < P; t++) {
                let n = {
                    u0: Math.random() * a,
                    v: Math.random() * a,
                    speedJitter: (Math.random() - 0.5) * 0.04,
                    radialJitter: (Math.random() - 0.5) * 0.08,
                  },
                  o = (function (e, t, n) {
                    let o,
                      i,
                      r = 0.06 + 0.28 * Math.random();
                    return (
                      Math.random() < e / (e + t)
                        ? ((o = Math.random() * e * 1.2 - 0.1 * e),
                          (i =
                            0.5 > Math.random()
                              ? -t * r - 40
                              : t * (1 + r) + 40))
                        : ((o =
                            0.5 > Math.random()
                              ? -e * r - 40
                              : e * (1 + r) + 40),
                          (i = Math.random() * t * 1.2 - 0.1 * t)),
                      {
                        startX: o,
                        startY: i,
                        curveAmount:
                          (40 + 90 * Math.random()) *
                          (0.5 > Math.random() ? 1 : -1),
                        entryDelay: (n / a) * 0.9 + 0.5 * Math.random(),
                        entryDuration: 1.6 + 1.2 * Math.random(),
                        wobbleFreqX: 1.2 + 2.4 * Math.random(),
                        wobbleFreqY: 1.2 + 2.4 * Math.random(),
                        wobblePhaseX: Math.random() * a,
                        wobblePhaseY: Math.random() * a,
                      }
                    );
                  })(k, I, n.u0);
                W.push({
                  color: e[t],
                  torus: n,
                  entry: o,
                  x: o.startX,
                  y: o.startY,
                  depthAlpha: 1,
                  depthSize: 1,
                  beamBoost: 0,
                  body: null,
                });
              }
              j = !0;
            })(),
            "falling" === O && es(),
            S && "spinning" === O && !X && j && ((J = 0), ea(60), eh(60)));
        },
        eA = () => {
          X ||
            ((X = !0),
            $ && ((z = globalThis.performance.now()), (er = 0), ($ = !1)),
            (Y = globalThis.window.requestAnimationFrame(ex)));
        },
        eM = () => {
          ((X = !1), Y && globalThis.window.cancelAnimationFrame(Y), (Y = 0));
        },
        eP = () => {
          globalThis.document.hidden ? eM() : Q && eA();
        };
      (globalThis.document.addEventListener("visibilitychange", eP), eS());
      let eB = new globalThis.ResizeObserver(eS);
      (eB.observe(t),
        t.addEventListener("mousemove", ec),
        t.addEventListener("mouseleave", eu),
        t.addEventListener("click", ey),
        M &&
          (t.addEventListener("pointerdown", ef),
          t.addEventListener("pointermove", em),
          t.addEventListener("pointerup", ev),
          t.addEventListener("pointercancel", ev)),
        t.addEventListener("touchstart", ed, { passive: !0 }),
        t.addEventListener("touchmove", ed, { passive: !0 }),
        t.addEventListener("touchend", ep),
        t.addEventListener("touchcancel", ep));
      let eC = new globalThis.IntersectionObserver(
        (e) => {
          for (let t of e)
            (Q = t.isIntersecting) && !globalThis.document.hidden
              ? S && "spinning" === O
                ? j && k > 0 && ((J = 0), ea(60), eh(60))
                : eA()
              : eM();
        },
        { threshold: 0.06, rootMargin: "0px 0px -22% 0px" },
      );
      return (
        eC.observe(t),
        () => {
          (eB.disconnect(),
            eC.disconnect(),
            globalThis.document.removeEventListener("visibilitychange", eP),
            t.removeEventListener("mousemove", ec),
            t.removeEventListener("mouseleave", eu),
            t.removeEventListener("click", ey),
            t.removeEventListener("pointerdown", ef),
            t.removeEventListener("pointermove", em),
            t.removeEventListener("pointerup", ev),
            t.removeEventListener("pointercancel", ev),
            t.removeEventListener("touchstart", ed),
            t.removeEventListener("touchmove", ed),
            t.removeEventListener("touchend", ep),
            t.removeEventListener("touchcancel", ep),
            (t.style.cursor = ""),
            Y && globalThis.window.cancelAnimationFrame(Y),
            o.default.World.clear(H, !1),
            o.default.Engine.clear(q));
        }
      );
    }, [s, l, c, u, d, p, f, m, v, y, g, h]),
    (0, t.jsx)("canvas", {
      ref: x,
      className: "pointer-events-none absolute inset-0 z-0",
      "aria-hidden": "true",
    })
  );
};
export default FooterTorus;
