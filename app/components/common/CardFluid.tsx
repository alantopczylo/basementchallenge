"use client";

import { useEffect } from "react";

/**
 * Portadas de las cards: en reposo van en gris; al pasar el mouse por la card, el cursor "pinta" el color con una estela
 * de tinta que se arrastra, se difumina y se apaga sola (distorsiona un poco la imagen en el borde de la mancha).
 *
 * Un solo canvas WebGL para todo el sitio: se monta dentro de la portada activa (`[data-fluid]`) y se quita al terminar,
 * así no hay un contexto por card. La tinta es un campo chico (128 px de ancho) en dos texturas que se van alternando.
 * Solo con mouse y sin movimiento reducido; si WebGL falla, las portadas quedan a color (el gris lo pone la clase `fluid-on`).
 */
const SIM_W = 128;
const IDLE_MS = 2800;

const VERT = `attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

// Paso de la tinta: arrastra con el movimiento del mouse, difumina, se apaga y suma una gota donde está el cursor
const SIM = `precision mediump float;
varying vec2 vUv;
uniform sampler2D uInk;
uniform vec2 uPt;
uniform vec2 uVel;
uniform vec2 uTexel;
uniform float uAspect;
uniform float uAmt;
uniform float uTime;
uniform vec3 uFlood;
void main(){
  // arrastre del mouse + remolino lento (la tinta serpentea sola)
  vec2 sw = vec2(sin(vUv.y * 11.0 + uTime * 1.3), cos(vUv.x * 9.0 - uTime * 1.1)) * 0.0028;
  vec2 p = vUv - uVel * 0.5 - sw;
  float c = texture2D(uInk, p).r * 4.0
    + texture2D(uInk, p + vec2(uTexel.x, 0.0)).r
    + texture2D(uInk, p - vec2(uTexel.x, 0.0)).r
    + texture2D(uInk, p + vec2(0.0, uTexel.y)).r
    + texture2D(uInk, p - vec2(0.0, uTexel.y)).r;
  float v = max(0.0, c / 8.0 * 0.992 - 0.003);
  vec2 d = (vUv - uPt) * vec2(uAspect, 1.0);
  v = min(1.0, v + uAmt * exp(-dot(d, d) / 0.014));
  // Inundación: un frente de tinta que avanza desde donde estaba el mouse (uFlood = origen xy + radio; radio < 0 apagado)
  if (uFlood.z > 0.0) {
    float fd = length((vUv - uFlood.xy) * vec2(uAspect, 1.0));
    v = max(v, smoothstep(uFlood.z, uFlood.z - 0.16, fd) * 0.9);
  }
  gl_FragColor = vec4(v, v, v, 1.0);
}`;

// Imagen: gris (mismo filtro que el CSS de reposo) que se vuelve color donde hay tinta; el borde de la mancha
// deforma la imagen y tiene un halo naranja muy leve
const SHOW = `precision mediump float;
varying vec2 vUv;
uniform sampler2D uImg;
uniform sampler2D uInk;
uniform vec2 uScale;
uniform vec2 uTexel;
void main(){
  float ink = texture2D(uInk, vUv).r;
  vec2 g = vec2(
    texture2D(uInk, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uInk, vUv - vec2(uTexel.x, 0.0)).r,
    texture2D(uInk, vUv + vec2(0.0, uTexel.y)).r - texture2D(uInk, vUv - vec2(0.0, uTexel.y)).r);
  float m = smoothstep(0.26, 0.36, ink);
  // la tinta actúa como una lente: curva la imagen sobre todo cerca del borde de la mancha
  vec2 uv = (vUv - 0.5) * uScale + 0.5 - g * (0.35 * m + 0.1);
  vec3 col = texture2D(uImg, uv).rgb;
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  vec3 gray = vec3((l - 0.5) * 1.15 + 0.5);
  vec3 o = mix(gray, col, m);
  float rim = smoothstep(0.24, 0.3, ink) * (1.0 - smoothstep(0.34, 0.46, ink));
  o += vec3(1.0, 0.35, 0.05) * rim * 0.35;
  gl_FragColor = vec4(o, 1.0);
}`;

export const CardFluid = () => {
  useEffect(() => {
    if (
      !window.matchMedia("(prefers-reduced-motion: no-preference)").matches ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    )
      return;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const link = (fsSrc: string) => {
      const vs = compile(gl.VERTEX_SHADER, VERT);
      const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
      const prog = gl.createProgram();
      if (!vs || !fs || !prog) return null;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.bindAttribLocation(prog, 0, "aPos");
      gl.linkProgram(prog);
      return gl.getProgramParameter(prog, gl.LINK_STATUS) ? prog : null;
    };
    const simP = link(SIM);
    const showP = link(SHOW);
    if (!simP || !showP) return;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const u = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const sim = {
      ink: u(simP, "uInk"),
      pt: u(simP, "uPt"),
      vel: u(simP, "uVel"),
      texel: u(simP, "uTexel"),
      aspect: u(simP, "uAspect"),
      amt: u(simP, "uAmt"),
      time: u(simP, "uTime"),
      flood: u(simP, "uFlood"),
    };
    const show = {
      img: u(showP, "uImg"),
      ink: u(showP, "uInk"),
      scale: u(showP, "uScale"),
      texel: u(showP, "uTexel"),
    };

    const tex = (w: number, h: number) => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (w)
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          w,
          h,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          null,
        );
      return t;
    };
    const imgTex = tex(0, 0);
    let simW = SIM_W;
    let simH = 40;
    const inkTex: WebGLTexture[] = [];
    const fbo: WebGLFramebuffer[] = [];
    const makeInk = (w: number, h: number) => {
      inkTex.forEach((t) => gl.deleteTexture(t));
      fbo.forEach((f) => gl.deleteFramebuffer(f));
      inkTex.length = 0;
      fbo.length = 0;
      for (let i = 0; i < 2; i++) {
        const t = tex(w, h);
        const f = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, f);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          t,
          0,
        );
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        inkTex.push(t);
        fbo.push(f as WebGLFramebuffer);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    let cover: HTMLElement | null = null;
    let scale = [1, 1];
    let read = 0;
    const pt = { x: 0.5, y: 0.5, vx: 0, vy: 0, moved: false };
    let lastActive = 0;
    // Si el mouse se mueve mucho sobre una portada, la tinta la inunda entera (y se escurre al salir de la card)
    let energy = 0;
    let flooding = false;
    let floodR = 0;
    let floodEnd = 2.3;
    let lastFrame = 0;
    let raf = 0;

    const detach = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.remove();
      cover = null;
      flooding = false;
      energy = 0;
      lastFrame = 0;
    };

    const attach = (el: HTMLElement) => {
      const img = el.querySelector("img");
      if (!img || !img.complete || !img.naturalWidth) return false;
      const rect = el.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (!w || !h) return false;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ar = w / h;
      const iar = img.naturalWidth / img.naturalHeight;
      scale = ar > iar ? [1, iar / ar] : [ar / iar, 1];
      simW = SIM_W;
      simH = Math.max(24, Math.round(SIM_W / ar));
      makeInk(simW, simH);
      read = 0;
      gl.bindTexture(gl.TEXTURE_2D, imgTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
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
        return false;
      }
      cover?.contains(canvas) && canvas.remove();
      cover = el;
      el.appendChild(canvas);
      return true;
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!cover) return;
      const dt = Math.min(0.05, (now - (lastFrame || now)) / 1000);
      lastFrame = now;
      energy = Math.max(0, energy - dt * 0.9);
      if (flooding) {
        floodR += dt * 3.2;
        lastActive = now;
        // la tinta ya cubrió toda la portada: queda a color de forma permanente
        if (floodR > floodEnd) {
          cover.dataset.fluidDone = "";
          detach();
          return;
        }
      }
      if (now - lastActive > IDLE_MS) {
        detach();
        return;
      }
      // 1) tinta
      const write = 1 - read;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[write]);
      gl.viewport(0, 0, simW, simH);
      gl.useProgram(simP);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, inkTex[read]);
      gl.uniform1i(sim.ink, 0);
      gl.uniform2f(sim.pt, pt.x, pt.y);
      gl.uniform2f(sim.vel, pt.vx, pt.vy);
      gl.uniform2f(sim.texel, 1 / simW, 1 / simH);
      gl.uniform1f(sim.aspect, simW / simH);
      gl.uniform1f(sim.time, now / 1000);
      gl.uniform3f(sim.flood, pt.x, pt.y, flooding ? floodR : -1);
      const speed = Math.hypot(pt.vx, pt.vy);
      gl.uniform1f(sim.amt, pt.moved ? 0.12 + Math.min(0.4, speed * 14) : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      read = write;
      pt.moved = false;
      pt.vx *= 0.6;
      pt.vy *= 0.6;
      // 2) imagen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(showP);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imgTex);
      gl.uniform1i(show.img, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, inkTex[read]);
      gl.uniform1i(show.ink, 1);
      gl.uniform2f(show.scale, scale[0], scale[1]);
      gl.uniform2f(show.texel, 1 / simW, 1 / simH);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    // La portada de la card bajo el mouse (la card entera cuenta: el link "estirado" tapa a la portada)
    const coverAt = (x: number, y: number) => {
      const card = document.elementFromPoint(x, y)?.closest("article");
      return card?.querySelector<HTMLElement>("[data-fluid]") ?? null;
    };

    let lx = 0;
    let ly = 0;
    const onMove = (e: PointerEvent) => {
      // arrastrando una lista (carrusel) la tinta no reacciona: la card se mueve bajo el mouse
      if (e.buttons) return;
      const el = coverAt(e.clientX, e.clientY);
      if (!el) {
        // fuera de la card: si estaba inundando termina de llenarse; si no, la tinta se escurre sola
        if (flooding) lastActive = performance.now();
        energy = 0;
        return;
      }
      if (el.dataset.fluidDone !== undefined) return;
      if (el !== cover) {
        if (cover) {
          if (flooding) cover.dataset.fluidDone = "";
          detach();
        }
        if (!attach(el)) return;
        lx = e.clientX;
        ly = e.clientY;
      }
      const r = el.getBoundingClientRect();
      // fuera de la portada (título, tags) la gota cae en el punto más cercano de la portada
      const x = Math.min(r.right, Math.max(r.left, e.clientX));
      const y = Math.min(r.bottom, Math.max(r.top, e.clientY));
      const nx = (x - r.left) / r.width;
      const ny = 1 - (y - r.top) / r.height;
      const lx0 = lx;
      const ly0 = ly;
      pt.vx = Math.max(-0.05, Math.min(0.05, (e.clientX - lx) / r.width));
      pt.vy = Math.max(-0.05, Math.min(0.05, -(e.clientY - ly) / r.height));
      lx = e.clientX;
      ly = e.clientY;
      pt.x = nx;
      pt.y = ny;
      pt.moved = true;
      lastActive = performance.now();
      energy += Math.hypot(e.clientX - lx0, e.clientY - ly0) / r.width;
      if (!flooding && energy > 1.8) {
        flooding = true;
        floodR = 0;
        // el frente tiene que pasar por la esquina más lejana (y su borde de 0.16) antes de dar la portada por llena
        const asp = simW / simH;
        const fx = Math.max(pt.x, 1 - pt.x) * asp;
        const fy = Math.max(pt.y, 1 - pt.y);
        floodEnd = Math.hypot(fx, fy) + 0.25;
      }
      if (!raf) raf = requestAnimationFrame(frame);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.classList.add("fluid-on");

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove("fluid-on");
      detach();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return null;
};
