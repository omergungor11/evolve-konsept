import * as THREE from "three";
import { sweepVertexShader, sweepFragmentShader } from "./sweep-shaders";

/** The method introduction's one-shot coaster, rendered with the original GLSL. */
export function bindMethodSweep(rail: HTMLElement) {
  let dispose: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    dispose?.();
    dispose = undefined;
  };
  const play = () => {
    stop();
    const mobile = matchMedia("(max-width: 767px)").matches;
    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "10",
    });
    rail.prepend(canvas);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      canvas.remove();
      return;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 500;
    const geometry = new THREE.BufferGeometry();
    const count = 1000,
      positions = new Float32Array(count * 3),
      start = new Float32Array(count * 2),
      end = new Float32Array(count * 2),
      curves = new Float32Array(count),
      timing = new Float32Array(count * 2),
      wobble = new Float32Array(count * 4),
      jiggle = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      start[i * 2] = -(1500 + Math.random() * 400);
      end[i * 2] = 1500 + Math.random() * 400;
      start[i * 2 + 1] = (Math.random() - 0.5) * (mobile ? 80 : 40);
      end[i * 2 + 1] = (Math.random() - 0.5) * 200;
      timing[i * 2] = Math.random() * 0.9;
      timing[i * 2 + 1] = 4 + Math.random() * 0.8;
      wobble[i * 4] = 1.2 + 2.4 * Math.random();
      wobble[i * 4 + 1] = 1.2 + 2.4 * Math.random();
      wobble[i * 4 + 2] = Math.random() * Math.PI * 2;
      wobble[i * 4 + 3] = Math.random() * Math.PI * 2;
      jiggle[i * 2] = mobile
        ? 0.4 + Math.random() * 0.6
        : 0.2 + Math.random() * 0.4;
      jiggle[i * 2 + 1] = 0.6 + Math.random() * 1.2;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aStart", new THREE.BufferAttribute(start, 2));
    geometry.setAttribute("aEnd", new THREE.BufferAttribute(end, 2));
    geometry.setAttribute("aCurve", new THREE.BufferAttribute(curves, 1));
    geometry.setAttribute("aTiming", new THREE.BufferAttribute(timing, 2));
    geometry.setAttribute("aWobble", new THREE.BufferAttribute(wobble, 4));
    geometry.setAttribute("aJiggle", new THREE.BufferAttribute(jiggle, 2));
    const uniforms = {
      uTime: { value: 0 },
      uScale: { value: 1 },
      uPixelRatio: { value: 1 },
      uSize: { value: mobile ? 2 : 1.4 },
      uColor: { value: new THREE.Color("#000000") },
      uPath: { value: 1 },
      uLoop: { value: new THREE.Vector3(mobile ? 130 : 140, 0.3, 0.7) },
      uWave: { value: new THREE.Vector2(0, 0) },
      uWobbleAmp: {
        value: new THREE.Vector2(mobile ? 12 : 4, mobile ? 12 : 4),
      },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: sweepVertexShader,
      fragmentShader: sweepFragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);
    const resize = () => {
      const width = Math.max(1, rail.clientWidth),
        height = Math.max(1, rail.clientHeight),
        ratio = Math.min(devicePixelRatio || 1, 2);
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      uniforms.uPixelRatio.value = ratio;
      uniforms.uScale.value = (0.5 * height) / Math.tan((75 * Math.PI) / 360);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(rail);
    const startTime = performance.now();
    let frame = 0;
    const render = () => {
      uniforms.uTime.value = (performance.now() - startTime) / 1000;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    dispose = () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      canvas.remove();
    };
    timer = setTimeout(stop, 6500);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) play();
        else stop();
      }
    },
    { threshold: 0.1 },
  );
  observer.observe(rail);
  return () => {
    observer.disconnect();
    stop();
  };
}
