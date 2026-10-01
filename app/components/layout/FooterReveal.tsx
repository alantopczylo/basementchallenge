"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { WORD_REVEAL } from "@/lib/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);
CustomEase.create("reveal", "0.16,1,0.3,1");


export const FooterReveal: React.FC = () => {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const footer = ref.current?.closest("footer");
      if (!footer) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = (s: string) =>
          Array.from(footer.querySelectorAll<HTMLElement>(s));
        const line = q('[data-f="line"]');
        const titles = q('[data-f="title"]');
        const links = q('[data-f="link"]');
        const wordmark = q('[data-f="wordmark"]');
        const legal = q('[data-f="legal"]');
        const icons = q('[data-f="icon"]');
        // Textos: el mismo movimiento que el título del hero (suben dentro de su máscara, transform en el compositor): no tiemblan
        const rise = (el: HTMLElement, delayMs: number) =>
          el.querySelectorAll<HTMLElement>(".hero-word").forEach((w) =>
            w.animate(
              [
                { transform: "translate(0, 140%)" },
                { transform: "translate(0, 0)" },
              ],
              {
                duration: WORD_REVEAL.duration,
                delay: delayMs,
                easing: WORD_REVEAL.easing,
                fill: "both",
              },
            ),
          );
        const playText = () => {
          titles.forEach((el, i) => rise(el, 80 + i * 100));
          links.forEach((el) =>
            rise(
              el,
              180 +
                Number(el.dataset.fCol ?? 0) * 100 +
                Number(el.dataset.fRow ?? 0) * 50,
            ),
          );
          legal.forEach((el, i) => rise(el, 600 + i * 100));
          icons.forEach((el) =>
            el.animate([{ opacity: 0 }, { opacity: 1 }], {
              duration: 800,
              delay: 700,
              easing: "ease-out",
              fill: "both",
            }),
          );
        };

        const tl = gsap.timeline({
          paused: true,
          defaults: { ease: "reveal" },
        });
        tl.fromTo(
          line,
          { scaleX: 0, opacity: 1, backgroundColor: "#ff4d00" },
          {
            scaleX: 1,
            backgroundColor: "#666666",
            duration: 0.8,
            ease: "power2.inOut",
          },
          0,
        );
        wordmark.forEach((el) => {
          const layers = Array.from(el.children) as HTMLElement[];
          // Sube un poco y aparece (sin recorte: el blur del wordmark se extiende por debajo de su caja y un recorte lo
          // cortaba mientras animaba y lo "soltaba" de golpe al terminar)
          tl.fromTo(
            layers,
            { y: 0, yPercent: 18, opacity: 0 },
            {
              y: 0,
              yPercent: 0,
              opacity: 1,
              duration: 1.2,
              onComplete: () => {
                el.dataset.fDone = "1";
                gsap.set(layers, { clearProps: "transform,opacity" });
              },
            },
            0.15,
          );
        });
        const st = ScrollTrigger.create({
          trigger: footer,
          start: "top bottom+=200",
          once: true,
          onEnter: () => {
            tl.play();
            playText();
          },
        });
        return () => {
          st.kill();
          tl.kill();
          // si se revierte, se deja todo visible
          gsap.set(line, {
            clearProps: "all",
          });
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return <span ref={ref} aria-hidden className="hidden" />;
};
