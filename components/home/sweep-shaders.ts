// Original method particle sweep shaders.
export const sweepVertexShader = `
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
export const sweepFragmentShader = `
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
