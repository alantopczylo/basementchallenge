"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onEnter, isSoftNav } from "@/lib/intro";
import { FrameCross } from "@/components/ui";

gsap.registerPlugin(ScrollTrigger);

const VERT = `attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

// La imagen ES el líquido: nace en varios puntos y se derrama por el marco. Donde el líquido recién llegó la imagen está
// deformada (ondulada y con un leve desfase de color) y a medida que "se asienta" se aclara hasta quedar nítida.
// Fuera del líquido el canvas es transparente y se ve el marco con su X.
const FRAG = `precision mediump float;
varying vec2 vUv;
uniform sampler2D uImg;
uniform vec2 uWin;
uniform vec2 uOff;
uniform float uAspect;
uniform float uProg;
uniform float uTime;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main(){
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  float a = uAspect;
  // ruido con dominio deformado: da el borde orgánico del líquido
  vec2 w = vec2(fbm(p * 1.6 + uTime * 0.35), fbm(p * 1.6 + 5.3 - uTime * 0.3));
  float n = fbm(p * 2.0 + w * 2.6);
  // distancia a la gota más cercana (3 semillas), normalizada
  float d = min(length(p - vec2(0.18 * a, 0.3)), min(length(p - vec2(0.62 * a, 0.82)), length(p - vec2(0.9 * a, 0.2))));
  d = min(d, length(p - vec2(0.4 * a, 0.5)) * 1.3 + 0.25) / (a * 0.62);
  float field = clamp(d * 0.55 + n * 0.55 - 0.1, 0.0, 1.0);
  // t: 0 = el líquido todavía no llegó, 1 = ya se asentó
  float soft = 0.85;
  float t = clamp((uProg * (1.0 + soft) - field) / soft, 0.0, 1.0);
  float alpha = smoothstep(0.0, 0.2, t);
  float amt = pow(1.0 - t, 1.6);
  vec2 flow = (w - 0.5) * 0.4 * amt + vec2(sin(p.y * 9.0 + uTime * 3.0), cos(p.x * 7.0 - uTime * 2.5)) * 0.012 * amt;
  vec2 base = uOff + vUv * uWin;
  vec2 shift = vec2(0.012, 0.0) * amt;
  float r = texture2D(uImg, base + flow + shift).r;
  float g = texture2D(uImg, base + flow).g;
  float b = texture2D(uImg, base + flow - shift).b;
  vec3 col = vec3(r, g, b);
  float rim = smoothstep(0.0, 0.25, t) * (1.0 - smoothstep(0.25, 0.6, t));
  col += vec3(1.0, 0.4, 0.1) * rim * 0.18;
  gl_FragColor = vec4(col * alpha, alpha);
}`;

export interface FluidImageProps {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  /** Posición del recorte de la imagen (como object-position): [x, y] de 0 a 1 */
  position?: [number, number];
}

/**
 * Imagen grande del post: entra como una mancha de tinta (WebGL) cuando aparece en pantalla, y al terminar se quita el
 * canvas y queda la imagen normal. Sin WebGL o con movimiento reducido se ve directa.
 */
export const FluidImage = ({
  src,
  alt,
  sizes,
  className,
  position = [0.5, 0.5],
}: FluidImageProps) => {
  const [px, py] = position;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      box.dataset.on = "";
      return;
    }
    const show = () => {
      box.dataset.on = "";
    };
    let cancelled = false;
    let canvas: HTMLCanvasElement | null = null;
    let tween: gsap.core.Animation | undefined;
    let offEnter: (() => void) | undefined;

    const run = (delay: number) => {
      const img = box.querySelector("img");
      if (!img) return show();
      const start = () => {
        if (cancelled) return;
        const w = box.clientWidth;
        const h = box.clientHeight;
        canvas = document.createElement("canvas");
        const dpr = Math.min(
          window.devicePixelRatio || 1,
          window.innerWidth < 768 ? 1 : 1.5,
        );
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.cssText =
          "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
        const gl = canvas.getContext("webgl", {
          // Con alfa: lo que la tinta todavía no descubrió es transparente y deja ver el marco con su X
          alpha: true,
          premultipliedAlpha: true,
          antialias: false,
          powerPreference: "low-power",
        });
        const sh = (type: number, s: string) => {
          const o = gl?.createShader(type);
          if (!gl || !o) return null;
          gl.shaderSource(o, s);
          gl.compileShader(o);
          return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null;
        };
        const vs = gl && sh(gl.VERTEX_SHADER, VERT);
        const fs = gl && sh(gl.FRAGMENT_SHADER, FRAG);
        const prog = gl?.createProgram();
        if (!gl || !vs || !fs || !prog) {
          canvas = null;
          return show();
        }
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.bindAttribLocation(prog, 0, "aPos");
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
          canvas = null;
          return show();
        }
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
          gl.STATIC_DRAW,
        );
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        try {
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img,
          );
        } catch {
          canvas = null;
          return show();
        }
        // recorte tipo object-fit: cover con object-position
        const ar = w / h;
        const iar = img.naturalWidth / img.naturalHeight;
        const win: [number, number] = ar > iar ? [1, iar / ar] : [ar / iar, 1];
        const off: [number, number] = [(1 - win[0]) * px, 0];
        // la textura está invertida en Y: el borde de abajo del recorte es v = 1 - (1 - win.y) * pos.y - win.y
        off[1] = 1 - (1 - win[1]) * py - win[1];
        const loc = (n: string) => gl.getUniformLocation(prog, n);
        gl.uniform1i(loc("uImg"), 0);
        gl.uniform2f(loc("uWin"), win[0], win[1]);
        gl.uniform2f(loc("uOff"), off[0], off[1]);
        gl.uniform1f(loc("uAspect"), ar);
        const uProg = loc("uProg");
        const uTime = loc("uTime");
        gl.viewport(0, 0, canvas.width, canvas.height);
        const st = { p: 0 };
        const draw = () => {
          gl.uniform1f(uProg, st.p);
          gl.uniform1f(uTime, performance.now() / 1000);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        draw();
        box.appendChild(canvas);
        // La <img> real sigue oculta mientras la tinta la descubre (el canvas es transparente donde todavía no llegó)
        tween = gsap
          .timeline({
            delay,
            onUpdate: draw,
            onComplete: () => {
              show();
              canvas?.remove();
              gl.getExtension("WEBGL_lose_context")?.loseContext();
              canvas = null;
            },
          })
          .to(st, { p: 1, duration: 2.8, ease: "power1.inOut" });
      };
      if (img.complete && img.naturalWidth) start();
      else img.addEventListener("load", start, { once: true });
    };

    // Arranca cuando la imagen asoma en pantalla (y la intro ya terminó); si ya estaba a la vista, espera al título y al texto
    const st = ScrollTrigger.create({
      trigger: box,
      start: "top bottom-=40",
      once: true,
      onEnter: () => {
        const inView = box.getBoundingClientRect().top < window.innerHeight;
        offEnter = onEnter(() =>
          run(inView ? (isSoftNav() ? 0.6 : 0.5) : 0.05),
        );
      },
    });
    return () => {
      cancelled = true;
      st.kill();
      offEnter?.();
      tween?.kill();
      canvas?.remove();
    };
  }, [px, py]);

  return (
    <div ref={ref} data-fluid-img data-story="frame" className={className}>
      {/* Marco con su X desde el principio: la tinta descubre la imagen por encima */}
      <FrameCross />
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        sizes={sizes}
        priority
        crossOrigin="anonymous"
        className="object-cover"
        style={{ objectPosition: `${px * 100}% ${py * 100}%` }}
      />
    </div>
  );
};
