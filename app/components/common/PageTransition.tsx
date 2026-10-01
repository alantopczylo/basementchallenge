"use client";

import { isLiveRoute } from "@/lib/site";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { holdEnter, releaseEnter, startsHeld } from "@/lib/intro";

/**
 * Transición entre páginas: la pantalla se cubre con píxeles grandes (un mosaico que se enciende en una onda desde donde
 * se hizo click, con desorden, pasando por grises y algún destello naranja), se navega por debajo y el mosaico se disuelve igual.
 * - Un solo canvas 2D fijo sobre todo el sitio (incluida la navbar); solo se dibujan rectángulos, sin filtros ni blur.
 * - Intercepta los links internos (clic normal). Atrás/adelante del navegador, nuevas pestañas, anclas y links externos
 *   quedan como estaban. Con "reducir movimiento" no se activa.
 * - Las entradas de la página nueva (título, textos, imagen) esperan a que el mosaico empiece a disolverse (lib/intro:
 *   holdEnter / releaseEnter) y se ven aparecer a través de él.
 */
type Go = () => void;
let run: ((go: Go, ox?: number, oy?: number) => void) | null = null;

/** Ejecuta `go` (una navegación) detrás de la transición; sin transición activa la ejecuta directo */
export const withPageTransition = (go: Go) => {
  if (run) run(go);
  else go();
};

const COVER = 0.85;
const REVEAL = 1;
// Paleta del sol del hero: el gradiente #FF4D00 → negro y sus luces (255,176,90) y (255,120,40)
// Negro único: con dos negros casi iguales se ve una trama de píxeles "raros" sobre la pantalla ya tapada
const BLACKS = ["#000000"];
const ORANGES = ["#ff4d00", "#ff4d00", "#ff7828", "#ffb05a"];
// tramos del gradiente del sol (del naranja de marca hacia el negro)
const BURNT = ["#cc3d00", "#992e00", "#661f00", "#330f00"];
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];

export const PageTransition = () => {
  const pathname = usePathname();
  const router = useRouter();
  const pathRef = useRef(pathname);
  const wait = useRef<(() => void) | null>(null);

  // Cuando la ruta cambia, la página nueva ya está montada: se disuelve el mosaico
  useEffect(() => {
    pathRef.current = pathname;
    const cb = wait.current;
    if (!cb) return;
    wait.current = null;
    // un par de cuadros para que la página nueva pinte antes de descubrirla
    requestAnimationFrame(() => requestAnimationFrame(cb));
  }, [pathname]);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches)
      return;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
      "position:fixed;inset:0;width:100%;height:100%;z-index:9000;pointer-events:none;visibility:hidden;";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let busy = false;
    let cols = 0;
    let rows = 0;
    let size = 0;
    let t1 = new Float32Array(0);
    let t2 = new Float32Array(0);
    // color de cada píxel en cada etapa (se elige al armar el mosaico)
    let c1: string[] = [];
    let c2: string[] = [];
    let c3: string[] = [];

    // Pixeles grandes (unos 11 por ancho); el mosaico se enciende en una onda desde donde se hizo click y con desorden
    const layout = (ox: number, oy: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      size = Math.max(56, Math.min(120, Math.round(w / 11)));
      cols = Math.ceil(w / size);
      rows = Math.ceil(h / size);
      const n = cols * rows;
      t1 = new Float32Array(n);
      t2 = new Float32Array(n);
      c1 = new Array(n);
      c2 = new Array(n);
      c3 = new Array(n);
      const far = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy));
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const d =
            Math.hypot((x + 0.5) * size - ox, (y + 0.5) * size - oy) / far;
          const diag = (x + y) / (cols + rows);
          t1[i] = 0.5 * d + 0.5 * Math.random();
          t2[i] = 0.5 * diag + 0.5 * Math.random();
          // etapa 1: destello naranja, etapa 2: tono medio, etapa 3: negro
          c1[i] = pick(ORANGES);
          c2[i] = Math.random() < 0.75 ? pick(BURNT) : pick(BLACKS);
          c3[i] = pick(BLACKS);
        }
    };

    // Cada píxel tiene su propio momento (t) y pasa por varios tonos: así se ve el mosaico y no solo negro
    const draw = (cover: boolean, p: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = cover ? t1 : t2;
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const q = Math.max(0, Math.min(1, (p - t[i] * 0.6) / 0.4));
          let color: string;
          if (cover) {
            if (q <= 0) continue;
            color = q < 0.34 ? c1[i] : q < 0.67 ? c2[i] : c3[i];
          } else {
            // al disolverse: negro → un destello naranja corto → fuera (sin pasar por tonos oscuros intermedios)
            if (q >= 0.5) continue;
            color = q <= 0 ? c3[i] : c1[i];
          }
          ctx.fillStyle = color;
          ctx.fillRect(x * size, y * size, size + 0.5, size + 0.5);
        }
    };

    const reveal = () => {
      // la página nueva arranca sus entradas junto con el mosaico que se disuelve
      releaseEnter();
      const s = { p: 0 };
      gsap.to(s, {
        p: 1,
        duration: REVEAL,
        ease: "power1.inOut",
        onUpdate: () => draw(false, s.p),
        onComplete: () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.style.visibility = "hidden";
          canvas.style.pointerEvents = "none";
          busy = false;
          window.dispatchEvent(new Event("pagetransitionend"));
        },
      });
    };

    run = (go, ox = window.innerWidth / 2, oy = window.innerHeight / 2) => {
      if (busy) return;
      busy = true;
      window.dispatchEvent(new Event("pagetransition"));
      layout(ox, oy);
      canvas.style.visibility = "visible";
      canvas.style.pointerEvents = "auto";
      const s = { p: 0 };
      gsap.to(s, {
        p: 1,
        duration: COVER,
        ease: "power1.inOut",
        onUpdate: () => draw(true, s.p),
        onComplete: () => {
          draw(true, 1.2);
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            wait.current = null;
            reveal();
          };
          wait.current = finish;
          // seguro por si la navegación nunca llega: no se queda tapado (largo, para no destapar la página vieja)
          window.setTimeout(finish, 10000);
          // lo que entra en la página nueva espera a que el mosaico empiece a disolverse
          holdEnter();
          go();
        },
      });
    };

    // Carga directa de una página interna: arranca tapada por el mosaico y se disuelve igual que en una navegación
    let start = 0;
    if (startsHeld()) {
      busy = true;
      window.dispatchEvent(new Event("pagetransition"));
      layout(window.innerWidth / 2, window.innerHeight / 2);
      canvas.style.visibility = "visible";
      canvas.style.pointerEvents = "auto";
      draw(true, 1.2);
      // un respiro para que pinten fuentes y estilos antes de descubrir
      start = window.setTimeout(reveal, 350);
    }

    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.hasAttribute("data-no-transition")) return;
      // click que termina un arrastre de una lista: no navega
      if (
        (a.closest("[data-cursor-drag]") as HTMLElement | null)?.dataset
          .dragged !== undefined
      )
        return;
      const href = a.getAttribute("href");
      if (
        !href ||
        (a.target && a.target !== "_self") ||
        a.hasAttribute("download")
      )
        return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // misma página (incluye anclas): sin transición
      if (url.pathname === window.location.pathname) return;
      e.preventDefault();
      run?.(
        () => router.push(url.pathname + url.search + url.hash),
        e.clientX,
        e.clientY,
      );
    };
    // Precarga la ruta apenas se apunta al link: al hacer click la página nueva ya está lista y el mosaico no espera
    const prefetch = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.hasAttribute("data-no-transition") || a.target) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const url = new URL(a.href, window.location.href);
      if (
        url.origin === window.location.origin &&
        url.pathname !== window.location.pathname &&
        isLiveRoute(url.pathname)
      )
        router.prefetch(url.pathname + url.search);
    };
    document.addEventListener("pointerover", prefetch, { passive: true });
    document.addEventListener("focusin", prefetch);
    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("pointerover", prefetch);
      document.removeEventListener("focusin", prefetch);
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(start);
      canvas.remove();
      run = null;
    };
  }, [router]);

  return null;
};
