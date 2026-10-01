"use client";

import React, { useRef } from "react";
import clsx from "clsx";

export interface DragScrollProps extends React.HTMLAttributes<HTMLUListElement> {
  children: React.ReactNode;
}

// Lista con scroll horizontal que avanza de a 1 item: en touch con scroll-snap (snap-always), con mouse
// arrastrando (al soltar avanza o retrocede 1 item según la dirección) y con las flechas del teclado.
// Si el mouse se movió más de 5px, se cancela el click para no navegar al soltar sobre un link.
const CLICK_THRESHOLD = 5;
const PAGE_THRESHOLD = 40;

export const DragScroll = ({
  className,
  children,
  ...props
}: DragScrollProps) => {
  const ref = useRef<HTMLUListElement>(null);
  const drag = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: false,
  });
  // Item destino de la animación en curso (evita que clicks/teclas repetidas se pisen entre sí)
  const target = useRef<number | null>(null);
  const timer = useRef<number | undefined>(undefined);

  // Ancho de un item + gap
  const getStep = () => {
    const items = ref.current?.children;
    if (!items || items.length < 2) return 1;
    return (
      (items[1] as HTMLElement).offsetLeft -
      (items[0] as HTMLElement).offsetLeft
    );
  };

  const goTo = (index: number) => {
    const el = ref.current;
    if (!el) return;
    const step = getStep();
    const max = el.scrollWidth - el.clientWidth;
    const maxIndex = Math.ceil(max / step);
    const clamped = Math.max(0, Math.min(index, maxIndex));
    target.current = clamped;
    window.clearTimeout(timer.current);
    el.style.scrollSnapType = "none";
    el.scrollTo({ left: Math.min(clamped * step, max), behavior: "smooth" });
    // El snap vuelve recién cuando terminó la última animación
    timer.current = window.setTimeout(() => {
      el.style.scrollSnapType = "";
      target.current = null;
    }, 600);
  };

  // Frena cualquier animación en curso (para que el arrastre no pelee con ella)
  const stopAnimation = (el: HTMLUListElement) => {
    window.clearTimeout(timer.current);
    target.current = null;
    el.style.scrollSnapType = "none";
    el.scrollTo({ left: el.scrollLeft, behavior: "instant" });
  };

  const currentIndex = () =>
    target.current ?? Math.round((ref.current?.scrollLeft ?? 0) / getStep());

  const onPointerDown = (e: React.PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !ref.current) return;
    stopAnimation(ref.current);
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: ref.current.scrollLeft,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > CLICK_THRESHOLD) {
      d.moved = true;
      el.style.scrollSnapType = "none";
      el.setPointerCapture(e.pointerId);
    }
    if (d.moved) el.scrollLeft = d.startScroll - dx;
  };

  const end = (e: React.PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    const el = ref.current;
    d.active = false;
    if (!el) return;
    if (el.hasPointerCapture(e.pointerId))
      el.releasePointerCapture(e.pointerId);
    if (d.moved) {
      // el click que sigue a un arrastre no debe navegar (lo leen también las transiciones de página)
      el.dataset.dragged = "";
      window.setTimeout(() => delete el.dataset.dragged, 0);
      const dx = e.clientX - d.startX;
      const startIndex = Math.round(d.startScroll / getStep());
      goTo(
        Math.abs(dx) > PAGE_THRESHOLD
          ? startIndex + (dx < 0 ? 1 : -1)
          : startIndex,
      );
    } else {
      // Click simple: se devuelve el control al snap
      el.style.scrollSnapType = "";
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (!ref.current || (e.key !== "ArrowRight" && e.key !== "ArrowLeft"))
      return;
    e.preventDefault();
    goTo(currentIndex() + (e.key === "ArrowRight" ? 1 : -1));
  };

  return (
    <ul
      ref={ref}
      tabIndex={0}
      data-cursor-drag
      className={clsx(
        "snap-x snap-mandatory cursor-grab select-none outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-basement-orange active:cursor-grabbing [&_img]:pointer-events-none",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={onKeyDown}
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={(e) => {
        if (drag.current.moved) {
          e.preventDefault();
          e.stopPropagation();
          drag.current.moved = false;
        }
      }}
      {...props}
    >
      {children}
    </ul>
  );
};
