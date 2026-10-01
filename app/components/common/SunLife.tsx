"use client";

import React, { useEffect, useRef } from "react";
import { onLit, isHeld } from "@/lib/intro";
import gsap from "gsap";


const N = 32;
/** El canvas sobresale por arriba del disco esta fracción de su alto, para que el borde pueda subir y bajar sin cortes */
const M = 0.35;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
// Desplazamiento vertical del borde en cada punto (uv; positivo = el borde baja, hacia adentro del sol)
uniform float uD[${N}];
uniform float uTime;

// Borde de arriba de la elipse en la columna x (uv, y hacia abajo)
float rim(float x) {
  float c = (x - 0.5) * 2.0;
  return 0.5 - 0.5 * sqrt(max(0.0, 1.0 - c * c));
}

void main() {
  // uv del disco (0..1, y hacia abajo); el canvas sobresale ${M} por arriba
  vec2 uv = vec2(vUv.x, (1.0 - vUv.y) * ${1 + M} - ${M});

  // Desplazamiento en esta columna (interpolación lineal entre los N puntos)
  float fx = clamp(uv.x, 0.0, 1.0) * float(${N - 1});
  float d = 0.0;
  // núcleo B-spline cuadrático: el borde queda curvo y suave entre puntos (no quebrado como con interpolación lineal)
  for (int i = 0; i < ${N}; i++) {
    float t = abs(fx - float(i));
    float k = t < 0.5 ? 0.75 - t * t : (t < 1.5 ? 0.5 * (1.5 - t) * (1.5 - t) : 0.0);
    d += uD[i] * k;
  }
  // ondulación fina que viaja sola por el borde: se siente líquido incluso entre empujes
  d += 0.012 * sin(uv.x * 23.0 - uTime * 2.1) * sin(uv.x * 7.0 + uTime * 0.9);

  // Perfil del borde original (blur suave del diseño) y el mismo perfil corrido por el empuje
  float depth = uv.y - rim(uv.x);
  float w = 0.07;
  float s0 = smoothstep(-w, w, depth);
  float s1 = smoothstep(-w, w, depth - d);

  // Solo cerca del borde de arriba
  float zone = (1.0 - smoothstep(0.22, 0.42, abs(depth))) * (1.0 - smoothstep(0.5, 0.62, uv.y));

  // Se hunde: oscurece lo que dejó de ser sol. Sale: suma luz naranja.
  float dent = clamp(1.0 - s1 / max(s0, 0.04), 0.0, 1.0) * smoothstep(0.03, 0.2, s0) * zone;
  float bulge = max(0.0, s1 - s0) * zone;
  vec3 orange = vec3(1.0, 0.33, 0.04);

  // borde vivo: un filo cálido sigue el contorno desplazado, más intenso mientras más se mueve
  float edge = exp(-pow((depth - d) / 0.045, 2.0)) * zone * clamp(abs(d) * 9.0, 0.0, 1.0);
  vec3 hot = vec3(1.0, 0.55, 0.16);
  vec3 col = orange * bulge * 0.95 + hot * edge * 0.35 * (1.0 - dent);
  float a = clamp(dent + edge * 0.35 * (1.0 - dent) + bulge * 0.95, 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}`;

// Red de seguridad: si el equipo no puede sostener ~25 fps (GPU débil, batería baja), se apaga la capa y queda el sol base.
// Se mide el tiempo entre frames reales; `window.__sunForce` la desactiva (para pruebas).
// El guardián de rendimiento es por montaje: antes el flag era global y, una vez que se disparaba (por ejemplo durante una
// transición de página), el efecto no volvía a funcionar al regresar a la home
const makeGuard = () => {
  let degraded = false;
  let start = 0;
  let prev = 0;
  let avg = 0;
  let n = 0;
  return (now: number) => {
    // durante una transición de página no se mide (el mosaico y la navegación cuestan cuadros)
    if (isHeld()) {
      start = 0;
      prev = 0;
      avg = 0;
      n = 0;
      return degraded;
    }
    if (!start) start = now;
    if (prev) {
      const d = now - prev;
      avg = n === 0 ? d : avg * 0.85 + d * 0.15;
      n++;
    }
    prev = now;
    const force = (window as unknown as { __sunForce?: boolean }).__sunForce;
    // Se decide después de 3 s de andar, con un mínimo de frames medidos
    if (now - start > 3000 && n > 20 && avg > 42 && !force) degraded = true;
    return degraded;
  };
};

const canPlay = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

/** Con mouse el borde responde al puntero; en táctil (sin hover) se mueve solo, en onda lenta */
const hasFinePointer = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Borde de arriba de la elipse en la columna x (uv, y hacia abajo); igual que en el shader */
const rimY = (x: number) => {
  const c = (x - 0.5) * 2;
  return 0.5 - 0.5 * Math.sqrt(Math.max(0, 1 - c * c));
};

/** Borde elástico (WebGL + resorte). Va como hijo de `.sun-move` para heredar amanecer, respiración y mouse. */
export const SunPlasma: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !canPlay()) return;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
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
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uD = gl.getUniformLocation(prog, "uD[0]");
    const uTime = gl.getUniformLocation(prog, "uTime");

    // Resolución baja: es un borde difuso (blur del diseño), no necesita más
    const SCALE = 0.25;
    const resize = () => {
      const w = Math.max(2, Math.round(canvas.clientWidth * SCALE));
      const h = Math.max(2, Math.round(canvas.clientHeight * SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Mouse sobre el disco (0..1), en coordenadas del canvas (incluye el movimiento/escala del sol)
    const pointer = { x: -1, y: -1, on: false, vx: 0 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      // velocidad horizontal (uv por frame, suavizada): el mouse deja una estela de ondas al cruzar el borde
      if (pointer.on) pointer.vx = pointer.vx * 0.5 + (nx - pointer.x) * 0.5;
      pointer.x = nx;
      pointer.y = ((e.clientY - r.top) / r.height) * (1 + M) - M;
      pointer.on = true;
    };
    const onLeave = () => {
      pointer.on = false;
    };
    const ambient = !hasFinePointer();
    if (!ambient) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeave);
    }

    // Física: N puntos con resorte hacia el objetivo (lo que pide el mouse), amortiguación baja (rebota) y acople con
    // los vecinos (la deformación se reparte en una onda en vez de ser un pico)
    const xs = Array.from({ length: N }, (_, i) => i / (N - 1));
    const ry = xs.map(rimY);
    const d = new Float32Array(N);
    const v = new Float32Array(N);
    const K = 48; // rigidez del resorte
    const C = 3.6; // amortiguación (baja: rebote visible, se siente a líquido)
    const COUPLE = 1800; // acople con vecinas (la onda viaja por el borde)
    const REACH = 0.14; // el mouse empieza a empujar a esta distancia por encima del borde (uv)
    const SPREAD = 0.09; // ancho del empuje en x (uv)
    const MAX = 0.2;
    let drawn = false;
    let clock = 0;

    // Aparece cuando el amanecer ya va avanzado
    canvas.style.opacity = "0";
    const offLit = onLit(() => {
      gsap.fromTo(
        canvas,
        { opacity: 0 },
        { opacity: 1, duration: 1.5, delay: 0.6, ease: "power1.inOut" },
      );
    });

    let raf = 0;
    let last = performance.now();
    const guard = makeGuard();
    const rimYAt = (x: number) => rimY(Math.min(1, Math.max(0, x)));
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (guard(now)) {
        cancelAnimationFrame(raf);
        gsap.killTweensOf(canvas);
        gsap.to(canvas, { opacity: 0, duration: 1 });
        return;
      }
      // En celular se limita a ~30 cuadros: el movimiento es lento y así gasta la mitad
      if (ambient && now - last < 30) return;
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;
      clock += dt;
      // Fuera del hero no se calcula ni se dibuja
      if (window.scrollY > window.innerHeight * 1.2) return;

      // Dos pasos de física por frame (estable con resortes duros)
      // Estela: al cruzar rápido el borde el mouse mete impulso en las vecinas (ondas que se alejan hacia los lados)
      if (!ambient && pointer.on && Math.abs(pointer.vx) > 0.001) {
        const near = pointer.y - rimYAt(pointer.x) > -REACH;
        if (near) {
          for (let i = 0; i < N; i++) {
            const gx = Math.exp(
              -((xs[i] - pointer.x) ** 2) / (2 * SPREAD * SPREAD * 1.6),
            );
            v[i] += gx * Math.min(0.12, Math.abs(pointer.vx)) * 5;
          }
        }
        pointer.vx *= 0.8;
      }
      const steps = 2;
      const h = dt / steps;
      let energy = 0;
      for (let s = 0; s < steps; s++) {
        for (let i = 0; i < N; i++) {
          let target = 0;
          const x0 = xs[i];
          // Respiración líquida de fondo (también con mouse, más suave): el borde nunca queda quieto del todo
          const idle =
            0.035 *
            (0.5 + 0.5 * Math.sin(x0 * 6.3 - clock * 0.9)) *
            (0.5 + 0.5 * Math.sin(x0 * 3.1 + clock * 0.6 + 0.8));
          target = idle;
          if (ambient) {
            // Sin puntero: el negro entra y sale del naranja en una onda lenta (dos ondas superpuestas, nunca repite igual)
            const x = xs[i];
            const w1 = 0.5 + 0.5 * Math.sin(x * 9.5 - clock * 1.1);
            const w2 = 0.5 + 0.5 * Math.sin(x * 4.2 + clock * 0.7 + 1.3);
            target = Math.max(target, 0.15 * w1 * (0.35 + 0.65 * w2));
          } else if (pointer.on) {
            const gx = Math.exp(
              -((xs[i] - pointer.x) ** 2) / (2 * SPREAD * SPREAD),
            );
            // u > 0: el mouse ya está dentro del sol (empuja el borde hasta donde llegó); u < 0: se acerca por encima
            const u = pointer.y - ry[i];
            const inward = 1 - Math.min(1, Math.max(0, (u - 0.2) / 0.25));
            target = Math.max(
              target,
              gx * Math.max(0, u + REACH) * 0.9 * inward,
            );
          }
          target = Math.min(MAX, target);
          const l = i > 0 ? d[i - 1] : d[i];
          const r = i < N - 1 ? d[i + 1] : d[i];
          const a =
            -K * (d[i] - target) -
            C * v[i] +
            COUPLE * (l + r - 2 * d[i]) * 0.01;
          v[i] += a * h;
        }
        for (let i = 0; i < N; i++) {
          d[i] = Math.max(-MAX, Math.min(MAX, d[i] + v[i] * h));
          energy += Math.abs(d[i]) + Math.abs(v[i]) * 0.05;
        }
      }
      // En reposo no se dibuja (una vez, para limpiar el último cuadro)
      if (energy < 0.002) {
        if (drawn) {
          d.fill(0);
          v.fill(0);
          gl.uniform1fv(uD, d);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          drawn = false;
        }
        return;
      }
      drawn = true;
      gl.uniform1fv(uD, d);
      gl.uniform1f(uTime, clock);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      offLit();
      cancelAnimationFrame(raf);
      if (!ambient) {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("mouseleave", onLeave);
      }
      ro.disconnect();
      gsap.killTweensOf(canvas);
      // No se libera el contexto a mano: React puede reusar el mismo <canvas> al volver a la página (effect mount→cleanup→mount)
      // y un contexto perdido no se puede recuperar, dejando el efecto muerto
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute left-0 w-full opacity-0"
      style={{ top: `${-M * 100}%`, height: `${(1 + M) * 100}%` }}
    />
  );
};
