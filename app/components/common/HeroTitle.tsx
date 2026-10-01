"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onEnter, isSoftNav } from "@/lib/intro";
import { STORY, WORD_REVEAL } from "@/lib/motion";

gsap.registerPlugin(useGSAP, CustomEase, ScrollTrigger);
// Al llegar por una transición de página el título arranca casi de inmediato (no espera a la intro)
const SOFT_DELAY = STORY.title * 1000;
// Sin lagSmoothing: si un frame se demora, el movimiento se pone al día en el tiempo real en vez de ir en cámara lenta (se sentía como trabado)
gsap.ticker.lagSmoothing(0);
CustomEase.create("reveal", "0.16,1,0.3,1");

export interface HeroTitleProps {
  /** Texto del título (string): las palabras se parten en el servidor */
  children: string;
  className?: string;
  /** Nivel de encabezado: h1 solo para el título principal de la página, h2 para los de sección */
  as?: "h1" | "h2";
  /** Segundos entre palabra y palabra */
  stagger?: number;
  /** "load": al cargar la página (hero) | "scroll": cuando el título entra en pantalla */
  trigger?: "load" | "scroll";
  /** Al terminar el reveal, una ola de luz cálida recorre las palabras una vez (el sol ilumina el texto) */
  glint?: boolean;
  /** Índices de palabras después de las cuales hay un salto de línea solo en mobile */
  mobileBreaks?: number[];
  /** Índices de palabras después de las cuales hay un salto de línea en todos los tamaños */
  breaks?: number[];
}

export const HeroTitle: React.FC<HeroTitleProps> = ({
  children,
  className,
  as: Tag = "h1",
  stagger = WORD_REVEAL.stagger / 1000,
  trigger = "load",
  glint = false,
  mobileBreaks = [],
  breaks = [],
}) => {
  const ref = useRef<HTMLHeadingElement>(null);
  const words = children.split(/\s+/).filter(Boolean);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let anims: Animation[] = [];
        let glintTween: gsap.core.Tween | undefined;
        // En la carga el título espera a que el sol vaya por la mitad (LOAD_OFFSET); al scrollear arranca en el momento
        const play = (
          wait: number = isSoftNav() ? SOFT_DELAY : WORD_REVEAL.delay,
        ) => {
          const words = gsap.utils.toArray<HTMLElement>(
            ".hero-word",
            ref.current,
          );
          // GSAP orquesta (matchMedia, useGSAP, escalonado y limpieza) y el movimiento lo corre el compositor (Web Animations):
          // no depende del hilo principal, así que no hay temblor al frenar. Se queda aplicado al final (fill both), sin "acomodo".
          anims = words.map((w, i) =>
            w.animate(
              [
                { transform: "translate(0, 140%)" },
                { transform: "translate(0, 0)" },
              ],
              {
                duration: WORD_REVEAL.duration,
                delay: wait + i * stagger * 1000,
                easing: WORD_REVEAL.easing,
                fill: "both",
              },
            ),
          );
          if (glint) startGlint(words);
        };
        const startGlint = (els: HTMLElement[]) => {
          const end =
            (WORD_REVEAL.delay +
              (els.length - 1) * WORD_REVEAL.stagger +
              WORD_REVEAL.duration) /
            1000;
          // Arranca un poco antes de que la última palabra termine de subir
          glintTween = gsap.to(els, {
            color: "#ffb896",
            duration: 0.28,
            ease: "sine.inOut",
            stagger: 0.1,
            yoyo: true,
            repeat: 1,
            delay: Math.max(0, end - 0.35),
            onComplete: () => {
              gsap.set(els, { clearProps: "color" });
            },
          });
        };

        // En "scroll" arranca apenas el título asoma por abajo de la pantalla, sin retraso
        if (trigger === "scroll") {
          const st = ScrollTrigger.create({
            trigger: ref.current,
            start: "top bottom-=20",
            once: true,
            onEnter: () => play(0),
          });
          return () => {
            st.kill();
            anims.forEach((a) => a.cancel());
            glintTween?.kill();
          };
        }
        // Arranca cuando el hilo principal quedó libre (hidratación y setup de los demás componentes terminados):
        // GSAP corre en el hilo principal, y si arranca en medio de ese trabajo se ve entrecortado.
        // Tope de 300 ms para que la espera no se note.
        let cancelled = false;
        let idle = 0;
        let timer = 0;
        let offLit: (() => void) | undefined;
        const raf = requestAnimationFrame(() => {
          // El título espera a que se prenda la luz (intro): recién ahí cuenta su retraso
          const go = () => {
            if (cancelled) return;
            offLit = onEnter(() => {
              if (!cancelled) play();
            });
          };
          if (typeof window.requestIdleCallback === "function") {
            idle = window.requestIdleCallback(go, { timeout: 300 });
          } else {
            timer = (window as Window).setTimeout(go, 60);
          }
        });
        return () => {
          cancelled = true;
          cancelAnimationFrame(raf);
          if (idle) window.cancelIdleCallback(idle);
          clearTimeout(timer);
          offLit?.();
          anims.forEach((a) => a.cancel());
          glintTween?.kill();
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Tag
      ref={ref}
      className={className}
      aria-label={children}
      data-hero={trigger}
    >
      {words.map((word, i) => (
        <React.Fragment key={i}>
          {/* overflow: clip no cambia la línea base (overflow: hidden sí); el padding/margin deja aire para las colas de g, y, comas */}
          <span
            aria-hidden
            className="inline-block [margin-block:-0.14em] [overflow:clip] [padding-block:0.14em]"
          >
            <span className="hero-word inline-block">{word}</span>
          </span>
          {breaks.includes(i) ? <br /> : null}
          {mobileBreaks.includes(i) ? <br className="md:hidden" /> : null}
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </Tag>
  );
};
