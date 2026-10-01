"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(useGSAP, SplitText, CustomEase);
CustomEase.create("flip", "0.76,0,0.24,1");

export interface FlipLabelProps {
  children: string;
  /** Color de la "otra cara" que aparece al hacer hover (default: el gris claro de la marca, #c4c4c4) */
  hoverClassName?: string;
  className?: string;
}

export const FlipLabel = ({
  children,
  hoverClassName = "text-basement-light-grey",
  className,
}: FlipLabelProps) => {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const frontRef = useRef<HTMLSpanElement>(null);
  const backRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      const front = frontRef.current;
      const back = backRef.current;
      if (!wrap || !front || !back) return;
      const trigger = wrap.closest<HTMLElement>("a,button") ?? wrap;

      const mm = gsap.matchMedia();
      mm.add(
        {
          canHover: "(hover: hover)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { canHover, reduceMotion } = context.conditions as {
            canHover: boolean;
            reduceMotion: boolean;
          };
          if (!canHover) return;

          let tl: gsap.core.Animation;
          if (reduceMotion) {
            tl = gsap.to(front, {
              color: getComputedStyle(back).color,
              duration: 0.2,
              paused: true,
            });
          } else {
            // Cada letra es una cara de un cubo: la actual sube y la otra entra desde abajo, con un delay mínimo entre letras.
            // El eje queda h/2 detrás del texto, así las dos caras forman siempre el mismo cubo.
            const h = front.getBoundingClientRect().height;
            const origin = `50% 50% ${-h / 2}px`;
            const frontSplit = SplitText.create(front, {
              type: "chars",
              aria: "auto",
            });
            const backSplit = SplitText.create(back, {
              type: "chars",
              aria: "none",
            });
            // Las letras quedan siempre en su propia capa (will-change): así el texto se dibuja igual en reposo, durante
            // el giro y al terminar, y no hay ese "reacomodo" final cuando el navegador cambia de capa.
            gsap.set([frontSplit.chars, backSplit.chars], {
              transformOrigin: origin,
              backfaceVisibility: "hidden",
              willChange: "transform",
            });
            // La cara naranja arranca oculta (recién ahora, con todo armado, se deja de ocultar por CSS)
            gsap.set(backSplit.chars, { rotationX: -90, autoAlpha: 0 });
            gsap.set(back, { autoAlpha: 1 });
            const opts = {
              duration: 0.36,
              ease: "flip",
              stagger: { amount: 0.05 },
            };
            tl = gsap
              .timeline({ paused: true })
              .to(frontSplit.chars, { rotationX: 90, ...opts }, 0)
              .to(backSplit.chars, { rotationX: 0, ...opts }, 0)
              // Se muestra la letra naranja apenas empieza a girar (y se oculta de nuevo al volver al reposo)
              .to(
                backSplit.chars,
                {
                  autoAlpha: 1,
                  duration: 0.01,
                  stagger: { amount: 0.05 },
                },
                0,
              );
          }

          const on = () => tl.play();
          const off = () => tl.reverse();
          const onFocus = () => {
            if (trigger.matches(":focus-visible")) tl.play();
          };
          trigger.addEventListener("pointerenter", on);
          trigger.addEventListener("pointerleave", off);
          trigger.addEventListener("focusin", onFocus);
          trigger.addEventListener("focusout", off);
          return () => {
            trigger.removeEventListener("pointerenter", on);
            trigger.removeEventListener("pointerleave", off);
            trigger.removeEventListener("focusin", onFocus);
            trigger.removeEventListener("focusout", off);
            tl.kill();
          };
        },
      );
      return () => mm.revert();
    },
    { scope: wrapRef },
  );

  // font-kerning: none desde el primer render: al partir el texto en letras el navegador pierde el kerning, y así
  // el ancho del link es el mismo antes y después de partirlo (sin que los links "se separen" al cargar).
  return (
    <span
      ref={wrapRef}
      className={`relative inline-block [font-kerning:none] [perspective:600px] ${className ?? ""}`}
    >
      <span ref={frontRef} className="block">
        {children}
      </span>
      <span
        ref={backRef}
        aria-hidden
        className={`invisible absolute inset-0 block ${hoverClassName}`}
      >
        {children}
      </span>
    </span>
  );
};
