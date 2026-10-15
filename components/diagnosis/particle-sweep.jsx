"use client";
// Original one-shot particle paths and shaders, using native React and Three.js.
import { useEffect, useRef } from "react";
import * as THREE from "three";

const flavors = {
  "ambient": {
    "count": 1000,
    "size": 1.4,
    "color": "#F0F0F8",
    "spawnXMin": 1500,
    "spawnXMax": 1900,
    "exitXMin": 1500,
    "exitXMax": 1900,
    "spawnYRange": 700,
    "durationMin": 3,
    "durationMax": 4.5,
    "delayRange": 6.5,
    "wobbleAmpX": 24,
    "wobbleAmpY": 20,
    "jiggleAmpMin": 0.6,
    "jiggleAmpMax": 1.8,
    "jiggleFreqMin": 0.6,
    "jiggleFreqMax": 2,
    "curveAmpMin": 40,
    "curveAmpMax": 130,
    "blending": THREE.AdditiveBlending
  },
  "swarm": {
    "count": 300,
    "size": 1.4,
    "color": "#F0F0F8",
    "spawnXMin": 1500,
    "spawnXMax": 1900,
    "exitXMin": 1500,
    "exitXMax": 1900,
    "spawnYRange": 220,
    "durationMin": 2,
    "durationMax": 3.2,
    "delayRange": 2.6,
    "wobbleAmpX": 70,
    "wobbleAmpY": 55,
    "jiggleAmpMin": 2,
    "jiggleAmpMax": 4.5,
    "jiggleFreqMin": 1.8,
    "jiggleFreqMax": 3.8,
    "curveAmpMin": 30,
    "curveAmpMax": 80,
    "blending": THREE.AdditiveBlending
  },
  "coaster": {
    "count": 1000,
    "size": 1.4,
    "color": "#F0F0F8",
    "spawnXMin": 1500,
    "spawnXMax": 1900,
    "exitXMin": 1500,
    "exitXMax": 1900,
    "spawnYRange": 40,
    "durationMin": 4,
    "durationMax": 4.8,
    "delayRange": 0.9,
    "wobbleAmpX": 4,
    "wobbleAmpY": 4,
    "jiggleAmpMin": 0.2,
    "jiggleAmpMax": 0.6,
    "jiggleFreqMin": 0.6,
    "jiggleFreqMax": 1.8,
    "curveAmpMin": 0,
    "curveAmpMax": 0,
    "blending": THREE.NormalBlending,
    "pathType": "coaster",
    "loopRadius": 140,
    "loopStart": 0.3,
    "loopEnd": 0.7
  },
  "diagonalWaves": {
    "count": 1000,
    "size": 1.4,
    "color": "#F0F0F8",
    "spawnXMin": 1500,
    "spawnXMax": 1900,
    "exitXMin": 1500,
    "exitXMax": 1900,
    "spawnYCenter": 360,
    "endYCenter": -360,
    "spawnYRange": 60,
    "durationMin": 4.8,
    "durationMax": 5.6,
    "delayRange": 1.1,
    "wobbleAmpX": 6,
    "wobbleAmpY": 6,
    "jiggleAmpMin": 0.3,
    "jiggleAmpMax": 0.8,
    "jiggleFreqMin": 0.8,
    "jiggleFreqMax": 2,
    "curveAmpMin": 0,
    "curveAmpMax": 0,
    "blending": THREE.AdditiveBlending,
    "pathType": "waves",
    "waveCount": 2.5,
    "waveAmp": 100
  }
};
const vertexShader = `
  attribute vec2 aStart;
  attribute vec2 aEnd;
  attribute float aCurve;
  attribute vec2 aTiming;  // (entryDelay, entryDuration)
  attribute vec4 aWobble;  // (freqX, freqY, phaseX, phaseY)
  attribute vec2 aJiggle;  // (amp, freq)

  uniform float uTime;
  uniform float uScale;       // (altura_px/2)/tan(fov/2) — mundo→px
  uniform float uPixelRatio;
  uniform float uSize;        // radio en unidades de canvas (config.size)
  uniform float uPath;        // 0 linear \xb7 1 coaster \xb7 2 waves
  uniform vec3 uLoop;         // (radius, loopStart, loopEnd)
  uniform vec2 uWave;         // (waveCount, waveAmp)
  uniform vec2 uWobbleAmp;    // (ampX, ampY) — nivel de config

  varying float vAlpha;

  void main() {
    float raw = (uTime - aTiming.x) / aTiming.y;
    // One-shot: antes de nacer o despu\xe9s de salir, la part\xedcula no dibuja.
    float alive = step(0.0, raw) * (1.0 - step(1.0, raw));
    float r = clamp(raw, 0.0, 1.0);

    // Viaje mayormente lineal con suavizado en los extremos (0.15) para
    // que entrada/salida no se sientan mec\xe1nicas — mismo piecewise del CPU.
    float eased = r < 0.15
      ? r * (r / 0.15)
      : (r > 0.85 ? 1.0 - (1.0 - r) * ((1.0 - r) / 0.15) : r);

    vec2 pos = mix(aStart, aEnd, eased);

    // Par\xe1bola vertical (pico al centro) — el coaster la trae en 0.
    pos.y += sin(eased * 3.14159265) * aCurve;

    // Coaster: c\xedrculo vertical completo overlaid entre loopStart..loopEnd
    // (la part\xedcula frena/retrocede cerca del \xe1pex, como un carrito real).
    if (uPath > 0.5 && uPath < 1.5) {
      if (eased >= uLoop.y && eased <= uLoop.z) {
        float u = (eased - uLoop.y) / (uLoop.z - uLoop.y);
        float th = u * 6.2831853;
        pos.x += uLoop.x * sin(th);
        pos.y += uLoop.x * (1.0 - cos(th));
      }
    } else if (uPath > 1.5) {
      // Olas: N periodos completos de sin a lo largo del viaje.
      pos.y += uWave.y * sin(eased * 6.2831853 * uWave.x);
    }

    // Wobble con decay hacia los extremos + jiggle de alta frecuencia.
    float decay = sin(eased * 3.14159265);
    pos.x += decay * uWobbleAmp.x * sin(uTime * aWobble.x + aWobble.z);
    pos.y += decay * uWobbleAmp.y * cos(uTime * aWobble.y + aWobble.w);
    pos.x += sin(uTime * aJiggle.y + aWobble.z) * aJiggle.x;
    pos.y += cos(uTime * aJiggle.y * 1.13 + aWobble.w) * aJiggle.x;

    vec4 mv = modelViewMatrix * vec4(pos, 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
    // uSize es radio → \xd72 para el di\xe1metro… \xd71.8 extra para compensar el
    // perfil suave (el mismo rol que el SPRITE_SCALE 2.2 de la dona, un
    // pel\xedn menor porque el polvo debe ser fino). Con size 1.4 y un marco
    // de ~590px: huella total ≈ 3.9px — la misma familia que la dona
    // (2.4–3.7px) y la tierra del mundo (2.0–3.3px).
    gl_PointSize = uSize * 3.6 * uScale * uPixelRatio / max(-mv.z, 0.001) * alive;

    // Twinkle sutil — mismo pulso de vida que el mundo y la dona.
    float twinkle = 0.88 + 0.12 * sin(uTime * 1.3 + aWobble.z * 4.0);
    vAlpha = alive * twinkle;
  }
`;
const fragmentShader = `
  uniform vec3 uColor;

  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    // El MISMO disco suave del mundo y la dona (n\xfacleo s\xf3lido ~28% +
    // ca\xedda smoothstep) — la petici\xf3n es literal: la misma part\xedcula.
    float disc = 1.0 - smoothstep(0.14, 0.5, d);
    if (disc < 0.004) discard;
    gl_FragColor = vec4(uColor, disc * vAlpha);
  }
`;

export function ParticleSweep({ flavor = "ambient", color }) {
  const container = useRef(null);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let config = flavors[flavor] ?? flavors.ambient;
    if (window.matchMedia("(max-width: 767px)").matches && flavor === "coaster") {
      config = { ...config, size: 2, spawnYRange: 80, loopRadius: 130, wobbleAmpX: 12, wobbleAmpY: 12, jiggleAmpMin: 0.4, jiggleAmpMax: 1 };
    }
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "block";
    element.appendChild(renderer.domElement);
    const geometry = new THREE.BufferGeometry();
    const attributes = {
      position: { size: 3, data: new Float32Array(config.count * 3) },
      aStart: { size: 2, data: new Float32Array(config.count * 2) },
      aEnd: { size: 2, data: new Float32Array(config.count * 2) },
      aCurve: { size: 1, data: new Float32Array(config.count) },
      aTiming: { size: 2, data: new Float32Array(config.count * 2) },
      aWobble: { size: 4, data: new Float32Array(config.count * 4) },
      aJiggle: { size: 2, data: new Float32Array(config.count * 2) },
    };
    const range = (min, max) => min + Math.random() * (max - min);
    const startY = config.spawnYCenter ?? 0;
    const endY = config.endYCenter ?? startY;
    for (let i = 0; i < config.count; i++) {
      attributes.aStart.data.set([-range(config.spawnXMin, config.spawnXMax), startY + (Math.random() - 0.5) * config.spawnYRange], i * 2);
      attributes.aEnd.data.set([range(config.exitXMin, config.exitXMax), endY + (Math.random() - 0.5) * (startY !== endY ? 80 : 200)], i * 2);
      attributes.aCurve.data[i] = range(config.curveAmpMin, config.curveAmpMax) * (Math.random() < 0.5 ? 1 : -1);
      attributes.aTiming.data.set([Math.random() * config.delayRange, range(config.durationMin, config.durationMax)], i * 2);
      attributes.aWobble.data.set([range(1.2, 3.6), range(1.2, 3.6), Math.random() * Math.PI * 2, Math.random() * Math.PI * 2], i * 4);
      attributes.aJiggle.data.set([range(config.jiggleAmpMin, config.jiggleAmpMax), range(config.jiggleFreqMin, config.jiggleFreqMax)], i * 2);
    }
    for (const [name, attribute] of Object.entries(attributes)) geometry.setAttribute(name, new THREE.BufferAttribute(attribute.data, attribute.size));
    const uniforms = {
      uTime: { value: 0 }, uScale: { value: 1 }, uPixelRatio: { value: renderer.getPixelRatio() },
      uSize: { value: config.size }, uColor: { value: new THREE.Color(color ?? config.color) },
      uPath: { value: config.pathType === "coaster" ? 1 : config.pathType === "waves" ? 2 : 0 },
      uLoop: { value: new THREE.Vector3(config.loopRadius ?? 0, config.loopStart ?? 0, config.loopEnd ?? 1) },
      uWave: { value: new THREE.Vector2(config.waveCount ?? 0, config.waveAmp ?? 0) },
      uWobbleAmp: { value: new THREE.Vector2(config.wobbleAmpX, config.wobbleAmpY) },
    };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false, blending: config.blending });
    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(particles);
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 500;
    const resize = () => {
      const width = Math.max(element.clientWidth, 1), height = Math.max(element.clientHeight, 1);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      uniforms.uScale.value = 0.5 * height / Math.tan(75 * Math.PI / 360);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    let frame = 0;
    const started = performance.now();
    const render = (now) => {
      uniforms.uTime.value = (now - started) / 1000;
      renderer.render(scene, camera);
      if (uniforms.uTime.value < config.delayRange + config.durationMax) frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      geometry.dispose(); material.dispose(); renderer.dispose(); renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [flavor, color]);
  return <div ref={container} aria-hidden="true" className="pointer-events-none absolute inset-0" />;
}
