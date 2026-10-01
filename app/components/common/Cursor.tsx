"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";

/** Separación de la trama de puntos (px), radio de la linterna y escalones de opacidad */
const SPACING = 8;
const RADIUS = 180;
const LEVELS = 8;
/** Elementos que el cursor "enmarca" */
const INTERACTIVE = "a, button, [role='button'], summary, label, select";
const TEXT_FIELDS = "input, textarea, [contenteditable='true']";
/** Por encima de este tamaño el elemento no se enmarca (cards): el cursor muestra una etiqueta */
const FRAME_MAX = { w: 420, h: 170 };
const FRAME_PAD = { x: 6, y: 4 };

type Dots = { color: (a: number) => string; clip?: DOMRect | null };


export const Cursor = ({
  viewPostLabel = "View post",
}: {
  viewPostLabel?: string;
}) => {
  const crossRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLCanvasElement>(null);
  const lightRef = useRef<HTMLCanvasElement>(null);
  // Sección clara de la página actual: el canvas gris vive DENTRO de ella, detrás de su contenido (z -1), así los
  // puntos quedan debajo de las cards y los textos y no encima
  const [host, setHost] = useState<Element | null>(null);

  useEffect(() => {
    let raf = 0;
    const find = () => {
      raf = 0;
      setHost((prev) => {
        const next = document.querySelector("[data-cursor-light]");
        return prev === next ? prev : next;
      });
    };
    find();
    const mo = new MutationObserver(() => {
      if (!raf) raf = requestAnimationFrame(find);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;
    const cross = crossRef.current;
    const frame = frameRef.current;
    const label = labelRef.current;
    const dragEl = dragRef.current;
    const arrowEls = Array.from(
      label?.querySelectorAll<HTMLElement>("[data-arrow]") ?? [],
    );
    const darkCv = darkRef.current;
    const lightCv = lightRef.current;
    if (!cross || !frame || !label || !dragEl || !darkCv) return;
    const darkCtx = darkCv.getContext("2d");
    const lightCtx = lightCv ? lightCv.getContext("2d") : null;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const html = document.documentElement;
    html.classList.add("has-cursor");

    const dur = reduce ? 0 : 1;
    const setCrossX = gsap.quickSetter(cross, "x", "px");
    const setCrossY = gsap.quickSetter(cross, "y", "px");
    const setDragX = gsap.quickSetter(dragEl, "x", "px");
    const setDragY = gsap.quickSetter(dragEl, "y", "px");
    const setLabelX = gsap.quickSetter(label, "x", "px");
    const setLabelY = gsap.quickSetter(label, "y", "px");
    const fx = gsap.quickTo(frame, "x", {
      duration: 0.25 * dur,
      ease: "power3.out",
    });
    const fy = gsap.quickTo(frame, "y", {
      duration: 0.25 * dur,
      ease: "power3.out",
    });
    const fw = gsap.quickTo(frame, "width", {
      duration: 0.25 * dur,
      ease: "power3.out",
    });
    const fh = gsap.quickTo(frame, "height", {
      duration: 0.25 * dur,
      ease: "power3.out",
    });
    gsap.set([cross, frame], { opacity: 0 });
    gsap.set(dragEl, { opacity: 0, scale: 0.5 });
    gsap.set(label, { opacity: 0, scale: 0.6, transformOrigin: "0% 0%" });

    // La luz va con inercia; `light.i` es su intensidad (0 apagada, 1 prendida)
    const light = { x: -999, y: -999, i: 0 };
    const lightX = gsap.quickTo(light, "x", {
      duration: 0.6,
      ease: "power3.out",
    });
    const lightY = gsap.quickTo(light, "y", {
      duration: 0.6,
      ease: "power3.out",
    });
    let shown = false;
    let overText = false;
    let hoverEl: Element | null = null;
    let mode: "none" | "frame" | "label" | "drag" = "none";

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      for (const [cv, ctx] of [
        [darkCv, darkCtx],
        [lightCv, lightCtx],
      ] as const) {
        if (!cv) continue;
        cv.width = Math.round(window.innerWidth * dpr);
        cv.height = Math.round(window.innerHeight * dpr);
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    resize();

    const drawDots = (
      ctx: CanvasRenderingContext2D | null,
      { color, clip }: Dots,
    ) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (light.i < 0.01) return;
      if (clip !== undefined && !clip) return;
      const paths = Array.from({ length: LEVELS }, () => new Path2D());
      const x0 = Math.floor((light.x - RADIUS) / SPACING);
      const x1 = Math.ceil((light.x + RADIUS) / SPACING);
      const y0 = Math.floor((light.y - RADIUS) / SPACING);
      const y1 = Math.ceil((light.y + RADIUS) / SPACING);
      for (let j = y0; j <= y1; j++) {
        // filas alternadas a medio paso: trama de imprenta
        const off = (j & 1) * (SPACING / 2);
        const py = j * SPACING;
        for (let i = x0; i <= x1; i++) {
          const px = i * SPACING + off;
          const d = Math.hypot(px - light.x, py - light.y);
          if (d >= RADIUS) continue;
          const t = 1 - d / RADIUS;
          const level = Math.min(
            LEVELS - 1,
            Math.floor(Math.pow(t, 1.3) * LEVELS),
          );
          const r = 0.35 + 0.85 * Math.pow(t, 1.15);
          const p = paths[level];
          p.moveTo(px + r, py);
          p.arc(px, py, r, 0, Math.PI * 2);
        }
      }
      ctx.save();
      if (clip) {
        ctx.beginPath();
        ctx.rect(clip.left, clip.top, clip.width, clip.height);
        ctx.clip();
      }
      ctx.globalAlpha = light.i;
      for (let l = 0; l < LEVELS; l++) {
        ctx.fillStyle = color((l + 1) / LEVELS);
        ctx.fill(paths[l]);
      }
      ctx.restore();
    };

    // Sección clara bajo el cursor (recorte del canvas gris); null si ninguna está a la vista
    const lightSectionRect = () => {
      for (const el of document.querySelectorAll("[data-cursor-light]")) {
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) return r;
      }
      return null;
    };

    // Un solo ticker: el marco sigue al elemento (aunque haga scroll) y la luz se redibuja solo si cambió
    let last = "";
    let lastSection = "";
    const tick = () => {
      // El elemento enmarcado se fue de la página (navegación): el marco se apaga
      if (mode === "frame" && hoverEl && !hoverEl.isConnected) reset();
      if (mode === "frame" && hoverEl?.isConnected) {
        const r = hoverEl.getBoundingClientRect();
        fx(r.left - FRAME_PAD.x);
        fy(r.top - FRAME_PAD.y);
        fw(r.width + FRAME_PAD.x * 2);
        fh(r.height + FRAME_PAD.y * 2);
      }
      if (reduce) return;
      const section = lightSectionRect();
      const key = `${light.x.toFixed(1)},${light.y.toFixed(1)},${light.i.toFixed(3)}`;
      const sKey = section
        ? `${section.top.toFixed(0)},${section.bottom.toFixed(0)}`
        : "-";
      if (key === last && sKey === lastSection) return;
      last = key;
      lastSection = sKey;
      drawDots(darkCtx, {
        color: (a) => `rgba(255, 226, 204, ${(a * 0.22).toFixed(3)})`,
      });
      drawDots(lightCtx, {
        color: (a) => `rgba(70, 70, 70, ${(a * 0.15).toFixed(3)})`,
        clip: section,
      });
    };
    gsap.ticker.add(tick);

    const syncVisibility = () => {
      gsap.to(cross, {
        opacity:
          shown && mode !== "frame" && mode !== "drag" && !overText ? 1 : 0,
        duration: 0.2 * dur,
        overwrite: "auto",
      });
      gsap.to(frame, {
        opacity: shown && mode === "frame" ? 1 : 0,
        duration: 0.2 * dur,
        overwrite: "auto",
      });
      const isDrag = shown && mode === "drag";
      gsap.to(dragEl, {
        opacity: isDrag ? 1 : 0,
        scale: isDrag ? 1 : 0.5,
        duration: (isDrag ? 0.3 : 0.18) * dur,
        ease: isDrag ? "back.out(2)" : "power2.in",
        overwrite: "auto",
      });
      const on = shown && mode === "label";
      gsap.to(label, {
        opacity: on ? 1 : 0,
        scale: on ? 1 : 0.6,
        duration: (on ? 0.28 : 0.1) * dur,
        ease: on ? "back.out(2)" : "power2.in",
        overwrite: "auto",
      });
    };
    // Durante una transición de página el cursor no enmarca nada (el botón clickeado ya no va a estar)
    let blocked = false;
    const reset = () => {
      hoverEl = null;
      hostEl = null;
      aimActive = false;
      mode = "none";
      syncVisibility();
    };
    const onTransitionStart = () => {
      blocked = true;
      reset();
    };
    const onTransitionEnd = () => {
      blocked = false;
    };
    window.addEventListener("pagetransition", onTransitionStart);
    window.addEventListener("pagetransitionend", onTransitionEnd);
    const show = () => {
      if (shown) return;
      shown = true;
      syncVisibility();
      if (!reduce) gsap.to(light, { i: 1, duration: 0.8, ease: "power2.out" });
    };
    const hide = () => {
      shown = false;
      syncVisibility();
      gsap.to(light, { i: 0, duration: 0.6, ease: "power2.out" });
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      // Si se soltó el botón fuera de la ventana o sin pointerup, la mira vuelve sola a su lugar
      if (e.buttons === 0 && pressed) onUp();
      curX = e.clientX;
      curY = e.clientY;
      // Arrastre real de una lista: el cursor pasa a ser el círculo con flechas
      if (
        pressed &&
        downInList &&
        !forceDrag &&
        Math.hypot(e.clientX - downX, e.clientY - downY) > 5
      ) {
        forceDrag = true;
        apply(
          document.elementFromPoint(e.clientX, e.clientY),
          e.clientX,
          e.clientY,
        );
      }
      if (!shown) {
        light.x = e.clientX;
        light.y = e.clientY;
      }
      show();
      setCrossX(e.clientX - 16);
      setCrossY(e.clientY - 16);
      setDragX(e.clientX - 28);
      setDragY(e.clientY - 28);
      setLabelX(e.clientX + 18);
      setLabelY(e.clientY + 16);
      lightX(e.clientX);
      lightY(e.clientY);
      // Entrar o salir de un botón `data-aim` sin cambiar de elemento (su link cubre la card): se reevalúa acá
      const aim = findAim(e.clientX, e.clientY);
      // Con el marco puesto, si el mouse sale del link sin que cambie el elemento bajo él (link "estirado"), se reevalúa
      let left = false;
      if (mode === "frame" && hostEl) {
        const hr = hostEl.getBoundingClientRect();
        left =
          e.clientX < hr.left - 2 ||
          e.clientX > hr.right + 2 ||
          e.clientY < hr.top - 2 ||
          e.clientY > hr.bottom + 2;
      }
      // Etiqueta "View post": si el mouse salió de la card (salida rápida) se apaga ya, sin esperar al próximo pointerover
      let outOfCard = false;
      if (mode === "label" && !forceDrag) {
        outOfCard = !document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest("article");
      }
      if (!!aim !== aimActive || (aim && aim !== hoverEl) || left || outOfCard)
        apply(
          document.elementFromPoint(e.clientX, e.clientY),
          e.clientX,
          e.clientY,
        );
    };
    // Botones secundarios (`data-aim`, ej. "Read more"): aunque su link cubra toda la card, el marco se cierra sobre el botón
    let aimActive = false;
    let hostEl: Element | null = null;
    const findAim = (x: number, y: number) => {
      if (blocked) return null;
      for (const a of document.querySelectorAll("[data-aim]")) {
        const r = a.getBoundingClientRect();
        if (
          x >= r.left - 2 &&
          x <= r.right + 2 &&
          y >= r.top - 2 &&
          y <= r.bottom + 2
        )
          return a;
      }
      return null;
    };
    const apply = (el: Element | null, x: number, y: number) => {
      overText = !!el?.closest(TEXT_FIELDS);
      const aim = findAim(x, y);
      aimActive = !!aim;
      const link = blocked ? null : (el?.closest(INTERACTIVE) ?? null);
      // Un link con un botón `data-aim` adentro (su área incluye el aire de arriba): el marco va sobre el botón, no sobre el link
      const target = aim ?? link?.querySelector("[data-aim]") ?? link;
      const hostRect = (aim ? aim : link)?.getBoundingClientRect();
      const prev = mode;
      const prevEl = hoverEl;
      hoverEl = target;
      hostEl = aim ?? link;
      if (!target) mode = "none";
      else {
        const r = target.getBoundingClientRect();
        const h = hostRect ?? r;
        // Links "estirados" (su área de click cubre toda la card) y elementos grandes: etiqueta en vez de marco
        // (con margen: los links del footer se corren 4px a la derecha al hover y el puntero quedaba "afuera")
        const inside =
          x >= h.left - 10 &&
          x <= h.right + 10 &&
          y >= h.top - 10 &&
          y <= h.bottom + 10;
        mode =
          !aim && (!inside || h.width > FRAME_MAX.w || h.height > FRAME_MAX.h)
            ? "label"
            : "frame";
        // Salto grande entre dos elementos: el marco se acomoda de una en vez de estirarse de uno a otro
        const far =
          prevEl &&
          prevEl !== target &&
          Math.hypot(
            prevEl.getBoundingClientRect().left - r.left,
            prevEl.getBoundingClientRect().top - r.top,
          ) > 60;
        if (mode === "frame" && (prev !== "frame" || far)) {
          // entra ya ubicado sobre el elemento; desde ahí lo sigue el ticker
          // (los quickTo siguen con su tween viejo: se los lleva al final para que no arrastren el marco desde el elemento anterior)
          fx(r.left - FRAME_PAD.x);
          fy(r.top - FRAME_PAD.y);
          fw(r.width + FRAME_PAD.x * 2);
          fh(r.height + FRAME_PAD.y * 2);
          for (const f of [fx, fy, fw, fh]) f.tween.progress(1);
          if (prev === "frame") gsap.set(frame, { opacity: 0 });
        }
      }
      // Listas arrastrables (DragScroll): el cursor propio tapa la manito nativa, así que la etiqueta avisa que se arrastra
      // Listas arrastrables: sobre una card el cartel "View post" lleva flechas a los costados (se hace click y también se
      // arrastra); en el aire de la lista y mientras se arrastra, círculo con flechas
      const inList = !!el?.closest("[data-cursor-drag]");
      const inCard = !!el?.closest("article");
      if (forceDrag || (inList && !inCard && mode !== "frame")) mode = "drag";
      const arrows = inList ? "inline" : "none";
      for (const a of arrowEls) a.style.display = arrows;
      syncVisibility();
    };
    const onOver = (e: PointerEvent) => {
      apply(
        e.target instanceof Element ? e.target : null,
        e.clientX,
        e.clientY,
      );
    };
    let pressed = false;
    let forceDrag = false;
    let downX = 0;
    let downY = 0;
    let downInList = false;
    let curX = 0;
    let curY = 0;
    const onDown = (e: PointerEvent) => {
      pressed = true;
      downX = e.clientX;
      downY = e.clientY;
      downInList = !!(e.target as Element | null)?.closest?.(
        "[data-cursor-drag]",
      );
      if (reduce) return;
      gsap.to(cross, { rotation: 45, duration: 0.25, ease: "power3.out" });
      gsap.to(frame, { scale: 0.94, duration: 0.2, ease: "power3.out" });
      gsap.to(dragEl, { scale: 0.82, duration: 0.2, ease: "power3.out" });
    };
    const onUp = () => {
      pressed = false;
      if (forceDrag) {
        forceDrag = false;
        apply(document.elementFromPoint(curX, curY), curX, curY);
      }
      if (reduce) return;
      gsap.to(cross, { rotation: 0, duration: 0.35, ease: "power3.out" });
      gsap.to(frame, { scale: 1, duration: 0.3, ease: "power3.out" });
      if (mode === "drag")
        gsap.to(dragEl, { scale: 1, duration: 0.3, ease: "back.out(2)" });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    // Arrastrar un link o una imagen cancela el pointer (no hay pointerup): sin esto la mira quedaba girada
    window.addEventListener("pointercancel", onUp, { passive: true });
    window.addEventListener("dragend", onUp, { passive: true });
    window.addEventListener("blur", onUp);
    document.documentElement.addEventListener("mouseleave", hide);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pagetransition", onTransitionStart);
      window.removeEventListener("pagetransitionend", onTransitionEnd);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("dragend", onUp);
      window.removeEventListener("blur", onUp);
      document.documentElement.removeEventListener("mouseleave", hide);
      window.removeEventListener("resize", resize);
      gsap.ticker.remove(tick);
      gsap.killTweensOf([cross, frame, label, dragEl, light]);
      html.classList.remove("has-cursor");
    };
  }, [host]);

  return (
    <>
      <canvas
        ref={darkRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[5] h-full w-full"
      />
      {host &&
        createPortal(
          <canvas
            ref={lightRef}
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
          />,
          host,
        )}
      {/* Mira de registro: trazos finos con hueco al centro */}
      <div
        ref={crossRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-8 w-8 text-white opacity-0 mix-blend-difference will-change-transform"
      >
        <svg
          viewBox="0 0 32 32"
          className="h-full w-full"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M0 16h11M21 16h11M16 0v11M16 21v11" />
        </svg>
      </div>
      {/* Marco de visor: cuatro esquinas que rodean el elemento */}
      <div
        ref={frameRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] text-white opacity-0 mix-blend-difference will-change-transform"
      >
        <span className="absolute left-0 top-0 h-2.5 w-2.5 border-l-[1.5px] border-t-[1.5px] border-current" />
        <span className="absolute right-0 top-0 h-2.5 w-2.5 border-r-[1.5px] border-t-[1.5px] border-current" />
        <span className="absolute bottom-0 left-0 h-2.5 w-2.5 border-b-[1.5px] border-l-[1.5px] border-current" />
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 border-b-[1.5px] border-r-[1.5px] border-current" />
      </div>
      {/* Listas arrastrables: un único cursor (círculo naranja con flechas) reemplaza a la mira y a la etiqueta */}
      <div
        ref={dragRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-basement-orange text-basement-black opacity-0 will-change-transform"
      >
        <svg
          viewBox="0 0 40 16"
          className="h-4 w-10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="square"
        >
          <path d="M11 2 4 8l7 6M29 2l7 6-7 6" />
        </svg>
      </div>
      {/* Etiqueta sobre cards: mismo lenguaje que los botones secundarios (naranja, mono, esquinas casi rectas) */}
      <div
        ref={labelRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] inline-flex h-[21px] items-center rounded-sm bg-basement-orange px-2 font-mono text-[11px] font-medium uppercase leading-none tracking-[-0.01em] text-basement-black opacity-0"
      >
        <span
          data-arrow
          className="mr-2 hidden text-[17px] font-normal leading-none"
          aria-hidden
        >
          ‹
        </span>
        {viewPostLabel}
        <span
          data-arrow
          className="ml-2 hidden text-[17px] font-normal leading-none"
          aria-hidden
        >
          ›
        </span>
      </div>
    </>
  );
};
