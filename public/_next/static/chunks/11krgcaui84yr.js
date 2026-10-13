(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,55988,e=>{"use strict";var a=e.i(93072),i=e.i(34416),t=e.i(72402),o=e.i(70304),n=e.i(21348);let r={ambient:{count:1e3,size:1.4,color:"#F0F0F8",spawnXMin:1500,spawnXMax:1900,exitXMin:1500,exitXMax:1900,spawnYRange:700,durationMin:3,durationMax:4.5,delayRange:6.5,wobbleAmpX:24,wobbleAmpY:20,jiggleAmpMin:.6,jiggleAmpMax:1.8,jiggleFreqMin:.6,jiggleFreqMax:2,curveAmpMin:40,curveAmpMax:130,blending:n.AdditiveBlending},swarm:{count:300,size:1.4,color:"#F0F0F8",spawnXMin:1500,spawnXMax:1900,exitXMin:1500,exitXMax:1900,spawnYRange:220,durationMin:2,durationMax:3.2,delayRange:2.6,wobbleAmpX:70,wobbleAmpY:55,jiggleAmpMin:2,jiggleAmpMax:4.5,jiggleFreqMin:1.8,jiggleFreqMax:3.8,curveAmpMin:30,curveAmpMax:80,blending:n.AdditiveBlending},coaster:{count:1e3,size:1.4,color:"#F0F0F8",spawnXMin:1500,spawnXMax:1900,exitXMin:1500,exitXMax:1900,spawnYRange:40,durationMin:4,durationMax:4.8,delayRange:.9,wobbleAmpX:4,wobbleAmpY:4,jiggleAmpMin:.2,jiggleAmpMax:.6,jiggleFreqMin:.6,jiggleFreqMax:1.8,curveAmpMin:0,curveAmpMax:0,blending:n.NormalBlending,pathType:"coaster",loopRadius:140,loopStart:.3,loopEnd:.7},diagonalWaves:{count:1e3,size:1.4,color:"#F0F0F8",spawnXMin:1500,spawnXMax:1900,exitXMin:1500,exitXMax:1900,spawnYCenter:360,endYCenter:-360,spawnYRange:60,durationMin:4.8,durationMax:5.6,delayRange:1.1,wobbleAmpX:6,wobbleAmpY:6,jiggleAmpMin:.3,jiggleAmpMax:.8,jiggleFreqMin:.8,jiggleFreqMax:2,curveAmpMin:0,curveAmpMax:0,blending:n.AdditiveBlending,pathType:"waves",waveCount:2.5,waveAmp:100}},l=`
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
`,u=`
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
`;function s(e){let{particles:t,config:r,color:s}=e,p=(0,i.useRef)(null),d=(0,i.useMemo)(()=>{let e=t.length,a=new Float32Array(3*e),i=new Float32Array(2*e),o=new Float32Array(2*e),r=new Float32Array(e),l=new Float32Array(2*e),u=new Float32Array(4*e),s=new Float32Array(2*e);for(let a=0;a<e;a++){let e=t[a];i[2*a]=e.startX,i[2*a+1]=e.startY,o[2*a]=e.endX,o[2*a+1]=e.endY,r[a]=e.curveAmount,l[2*a]=e.entryDelay,l[2*a+1]=e.entryDuration,u[4*a]=e.wobbleFreqX,u[4*a+1]=e.wobbleFreqY,u[4*a+2]=e.wobblePhaseX,u[4*a+3]=e.wobblePhaseY,s[2*a]=e.jiggleAmp,s[2*a+1]=e.jiggleFreq}let p=new n.BufferGeometry;return p.setAttribute("position",new n.BufferAttribute(a,3)),p.setAttribute("aStart",new n.BufferAttribute(i,2)),p.setAttribute("aEnd",new n.BufferAttribute(o,2)),p.setAttribute("aCurve",new n.BufferAttribute(r,1)),p.setAttribute("aTiming",new n.BufferAttribute(l,2)),p.setAttribute("aWobble",new n.BufferAttribute(u,4)),p.setAttribute("aJiggle",new n.BufferAttribute(s,2)),p},[t]),m=(0,i.useMemo)(()=>({uTime:{value:0},uScale:{value:1},uPixelRatio:{value:1},uSize:{value:r.size},uColor:{value:new n.Color(s)},uPath:{value:"coaster"===r.pathType?1:2*("waves"===r.pathType)},uLoop:{value:new n.Vector3(r.loopRadius??0,r.loopStart??0,r.loopEnd??1)},uWave:{value:new n.Vector2(r.waveCount??0,r.waveAmp??0)},uWobbleAmp:{value:new n.Vector2(r.wobbleAmpX,r.wobbleAmpY)}}),[r,s]);return(0,o.useFrame)(e=>{let{clock:a,size:i,gl:t}=e,o=p.current;o&&(o.uniforms.uTime.value=a.getElapsedTime(),o.uniforms.uScale.value=.5*i.height/Math.tan(75*Math.PI/360),o.uniforms.uPixelRatio.value=t.getPixelRatio())}),(0,a.jsx)("points",{geometry:d,frustumCulled:!1,children:(0,a.jsx)("shaderMaterial",{ref:p,vertexShader:l,fragmentShader:u,uniforms:m,transparent:!0,depthWrite:!1,blending:r.blending})})}e.s(["ParticleSweep",0,function(e){let{flavor:o="ambient",color:n}=e,l=(0,i.useMemo)(()=>{let e=r[o];return window.matchMedia("(max-width: 767px)").matches&&"coaster"===o?{...e,size:2,spawnYRange:80,loopRadius:130,wobbleAmpX:12,wobbleAmpY:12,jiggleAmpMin:.4,jiggleAmpMax:1}:e},[o]),u=n??l.color,[p]=(0,i.useState)(()=>(function(e){let a=[],i=e.spawnYCenter??0,t=e.endYCenter??i,o=i!==t?80:200;for(let n=0;n<e.count;n++){let n=-(e.spawnXMin+Math.random()*(e.spawnXMax-e.spawnXMin)),r=e.exitXMin+Math.random()*(e.exitXMax-e.exitXMin),l=i+(Math.random()-.5)*e.spawnYRange,u=t+(Math.random()-.5)*o;a.push({startX:n,endX:r,startY:l,endY:u,curveAmount:(e.curveAmpMin+Math.random()*(e.curveAmpMax-e.curveAmpMin))*(.5>Math.random()?1:-1),entryDelay:Math.random()*e.delayRange,entryDuration:e.durationMin+Math.random()*(e.durationMax-e.durationMin),wobbleFreqX:1.2+2.4*Math.random(),wobbleFreqY:1.2+2.4*Math.random(),wobblePhaseX:Math.random()*Math.PI*2,wobblePhaseY:Math.random()*Math.PI*2,jiggleAmp:e.jiggleAmpMin+Math.random()*(e.jiggleAmpMax-e.jiggleAmpMin),jiggleFreq:e.jiggleFreqMin+Math.random()*(e.jiggleFreqMax-e.jiggleFreqMin)})}return a})(l));return(0,a.jsx)("div",{className:"pointer-events-none absolute inset-0",children:(0,a.jsx)(t.Canvas,{dpr:[1,2],camera:{fov:75,position:[0,0,500]},children:(0,a.jsx)(s,{particles:p,config:l,color:u})})})}])},53880,e=>{e.n(e.i(55988))}]);