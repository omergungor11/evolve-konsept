"use client";
// Original archived Aurora shaders, rendered through native Three.js imports.
import { useEffect, useRef } from "react";
import * as THREE from "three";

const vertexShader = `in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;
const fragmentShader = `precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;
uniform float uFrequency;
uniform float uVerticalScale;
uniform float uVerticalOffset;
// Origin of the aurora brightness peak along uv.y (0 bottom, 1 top).
// Default 1.0 reproduces the legacy top-hanging curtain (see main).
uniform float uOriginY;
// Half-extent of the aurora band along uv.y. Pixels farther from
// uOriginY than uBandHalfWidth get zero falloff and read as ambient
// dark (only the residual noise/offset remains, which is below the
// alpha smoothstep midpoint when uVerticalOffset is small).
uniform float uBandHalfWidth;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ),
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \\
  int index = 0;                                              \\
  for (int i = 0; i < 2; i++) {                               \\
     ColorStop currentColor = colors[i];                      \\
     bool isInBetween = currentColor.position <= factor;      \\
     index = int(mix(float(index), float(i), float(isInBetween))); \\
  }                                                           \\
  ColorStop currentColor = colors[index];                     \\
  ColorStop nextColor = colors[index + 1];                    \\
  float range = nextColor.position - currentColor.position;   \\
  float lerpFactor = (factor - currentColor.position) / range; \\
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \\
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * uFrequency + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  // Triangular falloff peaking at uOriginY, fading to 0 over a span of
  // uBandHalfWidth in each direction. With uOriginY = bandHalfWidth =
  // 1.0 this expression equals uv.y, so the legacy top-hanging curtain
  // is preserved bit-for-bit.
  float falloff = max(0.0, 1.0 - abs(uv.y - uOriginY) / uBandHalfWidth);
  height = (falloff * uVerticalScale - height + uVerticalOffset);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;

  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

const defaultColors = ["#5227FF", "#7cff67", "#5227FF"];
const numericDefaults = {
  amplitude: 1, blend: 0.5, speed: 1, opacity: 1, frequency: 2,
  verticalScale: 2, verticalOffset: 0.2, originY: 1, bandHalfWidth: 1,
};
const uniformNames = {
  amplitude: "uAmplitude", blend: "uBlend", frequency: "uFrequency",
  verticalScale: "uVerticalScale", verticalOffset: "uVerticalOffset",
  originY: "uOriginY", bandHalfWidth: "uBandHalfWidth",
};
// OGL's original Color parser supplies unconverted RGB channels to the shader.
function rgb(hex) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  return [0, 2, 4].map((offset) => parseInt(full.slice(offset, offset + 2), 16) / 255);
}

export default function Aurora({ colorStops = defaultColors, className, ...props }) {
  const container = useRef(null);
  const latest = useRef({ ...numericDefaults, ...props, colorStops });
  const wake = useRef(null);
  useEffect(() => {
    latest.current = { ...numericDefaults, ...props, colorStops };
    wake.current?.();
  });

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, premultipliedAlpha: true, antialias: false });
    } catch { return; }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(1);
    renderer.domElement.style.backgroundColor = "transparent";
    renderer.domElement.style.display = "block";
    element.appendChild(renderer.domElement);
    const state = { ...latest.current, colorStops: latest.current.colorStops.map(rgb) };
    const uniforms = {
      uTime: { value: 0 }, uResolution: { value: new THREE.Vector2(1, 1) },
      uColorStops: { value: state.colorStops.map((color) => new THREE.Vector3(...color)) },
    };
    for (const [key, name] of Object.entries(uniformNames)) uniforms[name] = { value: state[key] };
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    const material = new THREE.RawShaderMaterial({
      vertexShader, fragmentShader, uniforms, glslVersion: THREE.GLSL3,
      transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation,
    });
    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);
    const camera = new THREE.Camera();
    const resize = () => {
      const width = Math.max(1, element.offsetWidth);
      const height = Math.max(1, element.offsetHeight);
      renderer.setSize(width, height);
      uniforms.uResolution.value.set(width, height);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(element);
    let frame = 0, running = false, visible = false, previous = null, elapsed = 0, time = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const render = (now) => {
      if (running) frame = requestAnimationFrame(render);
      const dt = previous === null ? 0 : Math.min((now - previous) / 1000, 0.1);
      previous = now;
      const target = latest.current;
      const mix = reduced ? 1 : 1 - Math.exp(-2 * dt);
      for (const key of Object.keys(numericDefaults)) state[key] += (target[key] - state[key]) * mix;
      const colors = target.colorStops.map(rgb);
      for (let i = 0; i < 3; i++) {
        for (let channel = 0; channel < 3; channel++) state.colorStops[i][channel] += (colors[i][channel] - state.colorStops[i][channel]) * mix;
        uniforms.uColorStops.value[i].set(...state.colorStops[i]);
      }
      time += dt * state.speed * 0.1;
      elapsed += dt;
      uniforms.uTime.value = time;
      for (const [key, name] of Object.entries(uniformNames)) uniforms[name].value = state[key];
      uniforms.uAmplitude.value *= 1 + 0.26 * Math.sin(elapsed / 5 * Math.PI * 2);
      element.style.opacity = String(state.opacity);
      renderer.render(scene, camera);
      if (running && target.opacity < 0.001 && state.opacity < 0.01) {
        state.opacity = 0;
        element.style.opacity = "0";
        stop();
      }
    };
    const start = () => {
      if (reduced) render(performance.now());
      else if (!running) { running = true; frame = requestAnimationFrame(render); }
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }, { threshold: 0 });
    observer.observe(element);
    const visibility = () => { if (document.hidden) stop(); else if (visible) start(); };
    document.addEventListener("visibilitychange", visibility);
    wake.current = () => { if (visible && !document.hidden) start(); };
    return () => {
      wake.current = null;
      stop(); observer.disconnect(); resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      geometry.dispose(); material.dispose(); renderer.dispose(); renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);
  return <div ref={container} aria-hidden="true" className={className} style={{ width: "100%", height: "100%" }} />;
}
