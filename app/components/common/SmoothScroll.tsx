"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
// La barra de direcciones del celular cambia el alto de la ventana al scrollear: sin esto ScrollTrigger recalcula todo a mitad del scroll
ScrollTrigger.config({ ignoreMobileResize: true });

// La instancia de Lenis (si hay) y si la última navegación fue atrás/adelante (ahí el navegador restaura el scroll)
let instance: Lenis | null = null;
let popped = false;

/** Pausa / reanuda el scroll suave (menú abierto, modales): overflow:hidden no frena los scrollTo de Lenis */
export const setSmoothScrollLocked = (locked: boolean) => {
  if (!instance) return;
  if (locked) instance.stop();
  else instance.start();
};


export const SmoothScroll = () => {
  const pathname = usePathname();

  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (popped) {
      popped = false;
      return;
    }
    if (instance) instance.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    const onPop = () => {
      popped = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        anchors: true,
        // Con el menú mobile abierto la página queda bloqueada (body con overflow hidden)
        prevent: () => document.body.style.overflow === "hidden",
      });
      // Si la página quedó scrolleada al cargar (recarga), arranca arriba sin animación
      const nav = performance.getEntriesByType("navigation")[0] as
        PerformanceNavigationTiming | undefined;
      if (nav?.type !== "back_forward" && window.scrollY > 0) {
        lenis.scrollTo(0, { immediate: true, force: true });
      }
      instance = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      return () => {
        gsap.ticker.remove(tick);
        instance = null;
        lenis.destroy();
      };
    });
    return () => mm.revert();
  }, []);

  return null;
};
