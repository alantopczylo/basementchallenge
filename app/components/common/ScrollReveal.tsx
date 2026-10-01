"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { HERO_OVERLAP, STORY, WORD_REVEAL, wordRevealEnd } from "@/lib/motion";
import { onEnter, isSoftNav } from "@/lib/intro";

gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create("reveal", "0.16,1,0.3,1");

/**
 * Entrada al hacer scroll para todo elemento con `data-reveal` (una sola instancia, va en el layout).
 * - `data-reveal` → sube 40px y aparece.
 * - `data-reveal="soft"` → casi solo un fundido (sube 20px): filtros, footer.
 * - `data-reveal="move"` → solo sube (para las cards de vidrio: animar opacity mataría su backdrop-filter mientras dura).
 * Los que entran juntos se escalonan (ScrollTrigger.batch). Detecta también elementos que aparecen después
 * (Load more, cambio de filtro, otra página) con un MutationObserver.
 * El estado inicial (oculto) lo pone CSS, así no hay flash antes de que GSAP arranque.
 */
export const ScrollReveal = () => {
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const seen = new WeakSet<Element>();
      const triggers: ScrollTrigger[] = [];
      // La primera tanda arranca cuando el título del hero está terminando (ver lib/motion), para no competir con él.
      // Sin título de hero en la página (ej. un post) no espera.
      // (se recalcula con cada título nuevo: también al navegar a otra página sin recargar)
      let delay = 0;

      // Al terminar, el elemento vuelve a ser uno normal: se le sacan los estilos de la animación y el data-reveal
      // (el CSS que lo escondía ya no le aplica). Así se dibuja igual que sin animación (sin capas ni transform residual).
      const settle = (el: HTMLElement) => {
        [
          "transform",
          "translate",
          "rotate",
          "scale",
          "clip-path",
          "overflow",
        ].forEach((p) => el.style.removeProperty(p));
        // Las capas con opacidad propia (ej. el ruido a 0.2) vuelven a la que definen en su estilo
        if (el.dataset.revealOpacity) el.style.opacity = "var(--ro, 0.2)";
        else el.style.removeProperty("opacity");
        el.removeAttribute("data-reveal");
      };

      const animate = (all: Element[]) => {
        // "wipe" (wordmark del footer): el wordmark sube desde abajo y el recorte del contenedor lo va descubriendo.
        // Solo se mueve un transform (corre en el compositor, sin repintar el blur ni el ruido, que son caros).
        const isWipe = (el: Element) =>
          (el as HTMLElement).dataset.reveal === "wipe";
        all.filter(isWipe).forEach((el) => {
          const layers = Array.from(el.children) as HTMLElement[];
          gsap.fromTo(
            layers,
            { y: 0, yPercent: 100 },
            {
              y: 0,
              yPercent: 0,
              duration: 1.5,
              ease: "reveal",
              onComplete: () => {
                // Al terminar se suelta el recorte (el blur del wordmark se extiende un poco por debajo de su caja)
                layers.forEach((l) => l.style.removeProperty("transform"));
                settle(el as HTMLElement);
              },
            },
          );
        });
        const kind = (el: Element) => (el as HTMLElement).dataset.reveal;
        const special = all.filter(
          (el) => kind(el) === "line" || kind(el) === "card",
        );
        const batch = all.filter((el) => !isWipe(el) && !special.includes(el));
        if (!batch.length && !special.length) return;
        const d = delay;
        delay = 0;
        // "line": se traza de izquierda a derecha (solo transform sobre una línea, no mueve texto)
        let cards = 0;
        special.forEach((el) => {
          const h = el as HTMLElement;
          if (kind(el) === "card") {
            // Card: la caja aparece con un fundido (sin moverse) y sus textos suben dentro de su máscara, igual que el título del hero
            const at = d + cards++ * 0.08;
            gsap.fromTo(
              h,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.7,
                ease: "power1.out",
                delay: at,
                onComplete: () => settle(h),
              },
            );
            // En el cuerpo de un post los textos además entran desde un desenfoque (se lee rápido: dura lo mismo que el movimiento)
            const blur = !!h.closest(".post-body, [data-blur]");
            h.querySelectorAll<HTMLElement>(".hero-word").forEach((w, i) => {
              w.animate(
                [
                  {
                    transform: "translate(0, 140%)",
                    ...(blur && { filter: "blur(6px)" }),
                  },
                  {
                    transform: "translate(0, 0)",
                    ...(blur && { filter: "blur(0px)" }),
                  },
                ],
                {
                  duration: blur ? 700 : WORD_REVEAL.duration,
                  delay: (at + 0.12) * 1000 + i * (blur ? 40 : 70),
                  easing: WORD_REVEAL.easing,
                  fill: "both",
                },
              );
            });
            return;
          }
          gsap.fromTo(
            h,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 1.2,
              ease: "reveal",
              delay: d,
              onComplete: () => settle(h),
            },
          );
        });
        if (!batch.length) return;
        // "move" (card de vidrio) y "fade" (sus capas y contenido) se animan juntos, sin escalonar: la card entera sube y aparece como una sola pieza
        const grouped = (el: Element) =>
          ["move", "fade"].includes((el as HTMLElement).dataset.reveal ?? "");
        let n = 0;
        // data-reveal-step: posición en una cascada propia (ej. la fila de cada columna del footer, así las columnas bajan en paralelo)
        const delays = batch.map((el) => {
          const step = (el as HTMLElement).dataset.revealStep;
          if (step !== undefined) return d + Number(step) * 0.06;
          return d + (grouped(el) ? 0 : n++ * 0.08);
        });
        gsap.fromTo(
          batch,
          {
            y: (_: number, el: HTMLElement) =>
              el.dataset.reveal === "move"
                ? 60
                : el.dataset.reveal === "fade"
                  ? 0
                  : el.dataset.reveal === "soft"
                    ? 20
                    : el.dataset.reveal === "unit"
                      ? 50
                      : 40,
            opacity: (_: number, el: HTMLElement) =>
              el.dataset.reveal === "move" ? 1 : 0,
          },
          {
            y: 0,
            // Algunas capas terminan con una opacidad propia (ej. el ruido a 0.2)
            opacity: (_: number, el: HTMLElement) =>
              Number(el.dataset.revealOpacity ?? 1),
            duration: 1.1,
            delay: (i: number) => delays[i],
            ease: "reveal",
            overwrite: true,
            onComplete: () => batch.forEach((el) => settle(el as HTMLElement)),
          },
        );
      };

      // Reúne los que entran casi juntos para escalonarlos
      let queue: Element[] = [];
      let flush = 0;
      const offLit: Array<() => void> = [];
      const enqueue = (el: Element) => {
        queue.push(el);
        window.clearTimeout(flush);
        flush = window.setTimeout(() => {
          const batch = queue.sort((x, y) =>
            x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING
              ? -1
              : 1,
          );
          queue = [];
          // Nada se anima hasta que arranca la entrada (la página está oculta hasta entonces)
          offLit.push(onEnter(() => animate(batch)));
        }, 50);
      };

      const offsetOf = (el: Element) => {
        let off = 0;
        for (let n: Element | null = el; n; n = n.parentElement) {
          if (n instanceof HTMLElement && n.dataset.reveal !== undefined) {
            off += new DOMMatrixReadOnly(getComputedStyle(n).transform).m42;
          }
        }
        return off;
      };

      const scan = () => {
        document
          .querySelectorAll<HTMLElement>(
            '[data-hero="load"]:not([data-hero-seen])',
          )
          .forEach((h) => {
            h.dataset.heroSeen = "";
            const n = h.querySelectorAll(".hero-word").length;
            if (n)
              delay = Math.max(
                delay,
                wordRevealEnd(n, isSoftNav() ? STORY.title * 1000 : undefined) -
                  HERO_OVERLAP,
              );
          });
        const fresh = Array.from(
          document.querySelectorAll<HTMLElement>("[data-reveal]"),
        ).filter((el) => !seen.has(el));
        if (!fresh.length) return;
        fresh.forEach((el) => seen.add(el));
        fresh.forEach((el) => {
          triggers.push(
            ScrollTrigger.create({
              trigger: el,
              // El estado inicial (CSS) los baja unos px, y ScrollTrigger mide la posición ya desplazada:
              // se descuenta ese desplazamiento (el propio y el de los padres) para disparar según su lugar real
              // Los textos del cuerpo de un post arrancan antes de entrar en cuadro: al llegar con el scroll ya se pueden leer
              start: () =>
                `top+=${-offsetOf(el)} bottom+=${el.closest(".post-body") ? 240 : 80}`,
              invalidateOnRefresh: true,
              once: true,
              onEnter: () => enqueue(el),
            }),
          );
        });
      };

      scan();
      let raf = 0;
      const mo = new MutationObserver(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(scan);
      });
      mo.observe(document.body, { childList: true, subtree: true });

      return () => {
        mo.disconnect();
        offLit.forEach((off) => off());
        window.clearTimeout(flush);
        cancelAnimationFrame(raf);
        triggers.forEach((t) => t.kill());
        // Sin animación activa: deja todo visible
        document
          .querySelectorAll<HTMLElement>("[data-reveal]")
          .forEach((el) => {
            gsap.killTweensOf(el);
            el.style.opacity = el.dataset.revealOpacity ?? "1";
            el.style.transform = "none";
          });
      };
    });
    return () => mm.revert();
  }, []);

  return null;
};
