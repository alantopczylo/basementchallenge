import React from "react";

/**
 * Las dos diagonales de un marco vacío (el "X" del placeholder de imagen). Va dentro de un contenedor `relative`:
 * llena su caja y no recibe clicks. Con imagen, la imagen se dibuja por encima.
 */
export const FrameCross = () => (
  <svg
    aria-hidden
    className="pointer-events-none absolute inset-0 h-full w-full text-basement-grey"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
  >
    <line
      x1="0"
      y1="0"
      x2="100"
      y2="100"
      stroke="currentColor"
      strokeWidth="1"
      vectorEffect="non-scaling-stroke"
    />
    <line
      x1="100"
      y1="0"
      x2="0"
      y2="100"
      stroke="currentColor"
      strokeWidth="1"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);
