"use client";

import React from "react";

/**
 * "Skip to content": salta la navbar y lleva el foco al primer elemento interactivo del contenido.
 * Un simple #ancla no alcanzaba: en la home el <main> arranca arriba de todo, así que no se veía ningún cambio
 * (y el foco quedaba en un contenedor sin contorno). Así el foco se ve y el siguiente Tab sigue desde ahí.
 */
export const SkipLink: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <a
    href="#main-content"
    onClick={(e) => {
      const main = document.getElementById("main-content");
      if (!main) return;
      e.preventDefault();
      const first = main.querySelector<HTMLElement>(
        "a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      (first ?? main).focus();
      (first ?? main).scrollIntoView({ block: "center" });
    }}
    className="fixed left-3 top-3 z-[10000] -translate-y-[200%] rounded-sm bg-basement-orange px-3 py-2 font-mono text-[12px] font-medium uppercase text-basement-black transition-transform focus:translate-y-0"
  >
    {children}
  </a>
);
