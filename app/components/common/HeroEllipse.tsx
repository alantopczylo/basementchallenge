"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { noiseBackground } from "@/lib/noise";
import { SunPlasma } from "@/components/common/SunLife";
import { onLit } from "@/lib/intro";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Elipse de fondo del hero (Figma "Ellipse 4265"), gradiente #FF4D00 -4.68% -> #000 44.18%.
 *
 *            Desktop (frame 1920)     Mobile (frame 390)
 *  tamaño    2447.94 x 1243.59        805.73 x 535.14
 *  top/left  472 / -301.47            276 / -207.87 (ambas centradas)
 *  blur      progressive 100 -> 50    progressive 75 -> 20   (Y 15.59% -> 100%)
 *  noise     size 0.5, negro 25%      size 0.17, negro 25%
 *
 * Las medidas y el blur viven en `.hero-ellipse` (globals.css).
 * Noise: size 0.5 -> baseFrequency 0.9 | size 0.17 -> ~2.65 (grano más fino)
 *
 * Movimiento (es un sol):
 * 1. Encendido tipo dimmer cuando arranca la entrada del sitio: no se mueve de lugar, sube el brillo y se abre un poco.
 * 2. Después pulsa como calor/brasa: irregular y suave.
 * 3. Al bajar por el hero se va poniendo: baja más lento que la página (sin apagarse).
 * Todo es transform/opacity sobre una capa que se dibuja una sola vez (el blur es caro de repintar).
 * El estado inicial (abajo y apagado) lo pone CSS (.hero-ellipse) para que no haya flash antes de que GSAP arranque.
 */
const noiseLayer: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundSize: "200px 200px",
  opacity: 0.5,
};

export const HeroEllipse: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const sun = ref.current?.querySelector<HTMLElement>(".sun-move");
        const beam = ref.current?.querySelector<HTMLElement>(".hero-beam");
        const wrap = ref.current?.querySelector<HTMLElement>("[data-sun-wrap]");
        if (!sun || !wrap) return;

        // 3) Atardecer con el scroll: baja más lento que la página (sin apagarse)
        // En touch el scroll lo mueve el compositor y una animación atada al scroll desde JS va siempre un cuadro atrasada
        // (se siente "lageada"): ahí el sol queda fijo
        const touch = window.matchMedia(
          "(hover: none), (pointer: coarse)",
        ).matches;
        const set = touch
          ? null
          : gsap.to(wrap, {
              y: () => window.innerHeight * 0.3,
              ease: "none",
              scrollTrigger: {
                trigger: document.documentElement,
                start: 0,
                end: () => window.innerHeight * 1.1,
                scrub: true,
                invalidateOnRefresh: true,
              },
            });

        // 4) La luz sigue al mouse: el disco se corre unos px hacia el cursor (solo con mouse, no en touch)
        const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
        let moveX: ((v: number) => void) | undefined;
        const onMove = (e: PointerEvent) => {
          moveX?.((e.clientX / window.innerWidth - 0.5) * 36);
        };
        if (fine.matches) {
          moveX = gsap.quickTo(sun, "x", { duration: 1.4, ease: "power3.out" });
          window.addEventListener("pointermove", onMove, { passive: true });
        }

        let cancelled = false;
        let idle = 0;
        let ignite: gsap.core.Timeline | undefined;
        let heat: gsap.core.Tween | undefined;
        let offLit: (() => void) | undefined;
        // 2) Pulso de calor: irregular y suave (escala y brillo cambian a destiempo, como el calor de una lámpara)
        const pulse = () => {
          if (cancelled) return;
          heat = gsap.to(sun, {
            scale: gsap.utils.random(1.008, 1.02),
            opacity: gsap.utils.random(0.94, 1),
            duration: gsap.utils.random(2.6, 4.6),
            ease: "sine.inOut",
            onComplete: pulse,
          });
        };
        const play = () => {
          if (cancelled) return;
          // 1) Encendido tipo dimmer: la luz no se mueve, se prende. Sube el brillo y se abre un poco (bloom)
          if (beam)
            gsap.to(beam, { opacity: 1, duration: 2.4, ease: "power2.out" });
          ignite = gsap
            .timeline({ onComplete: pulse })
            .fromTo(
              sun,
              { opacity: 0, scale: 0.94 },
              { opacity: 1, scale: 1, duration: 2, ease: "power2.out" },
            );
        };
        // Arranca cuando el hilo principal quedó libre y se prendió la luz (intro)
        const raf = requestAnimationFrame(() => {
          const go = () => {
            offLit = onLit(play);
          };
          if (typeof window.requestIdleCallback === "function") {
            idle = window.requestIdleCallback(go, { timeout: 250 });
          } else {
            idle = window.setTimeout(go, 60);
          }
        });
        return () => {
          cancelled = true;
          window.removeEventListener("pointermove", onMove);
          cancelAnimationFrame(raf);
          if (idle) {
            if (typeof window.cancelIdleCallback === "function")
              window.cancelIdleCallback(idle);
            clearTimeout(idle);
          }
          offLit?.();
          ignite?.kill();
          heat?.kill();
          set?.scrollTrigger?.kill();
          set?.kill();
          gsap.set([sun, wrap], { clearProps: "all" });
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden [transform:translateZ(0)]"
    >
      <div data-sun-wrap className="absolute inset-0">
        {/* Haz de la lámpara: baja desde arriba y se posa en el charco de luz (el "sol") */}
        <div className="hero-beam" />
        {/* .sun-move: caja del sol (recibe amanecer, respiración y mouse); .hero-ellipse: el disco con su blur */}
        <div className="sun-move">
          <div
            className="hero-ellipse"
            style={{
              borderRadius: "50%",
              // Núcleo cálido (el foco) sobre el degradé del Figma: hace que se lea como una luz y no como un horizonte
              background:
                "radial-gradient(ellipse 30% 24% at 50% 9%, rgba(255,176,90,0.42), rgba(255,120,40,0.2) 48%, transparent 78%), linear-gradient(180deg, #FF4D00 -4.68%, #000000 44.18%)",
            }}
          />
          <SunPlasma />
        </div>
      </div>
      {/* monotone noise: solo píxeles negros con alpha (sobre el fondo negro es invisible) */}
      <div
        className="md:hidden"
        style={{ ...noiseLayer, backgroundImage: noiseBackground(2.65) }}
      />
      <div
        className="hidden md:block"
        style={{ ...noiseLayer, backgroundImage: noiseBackground(0.9) }}
      />
    </div>
  );
};
