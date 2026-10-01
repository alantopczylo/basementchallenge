"use client";

import React, { useEffect, useRef, useState } from "react";

// Mobile 4 columnas (gap 12) | tablet y desktop 6 (gap 32)
const COLUMNS = 6;
/** Cuánto dura el aviso de "Grid on / off" (ms) */
const TOAST_MS = 1600;

/**
 * Overlay de grilla para revisar el layout: 4 columnas en mobile y 6 en tablet/desktop.
 * Mismo ancho que la navbar (1372px máx.), gap 32px -> en desktop cada columna mide 202px
 * (una card de 436px = 2 columnas + 1 gap).
 * Se prende y apaga con Ctrl + G, también en producción (sin botón: no ensucia el diseño). Un aviso chico confirma el
 * cambio y un mensaje en la consola cuenta que existe.
 */
export const GridOverlay: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [toast, setToast] = useState(false);
  const timer = useRef(0);

  useEffect(() => {
    console.info("Tip: press Ctrl + G to toggle the layout grid.");
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "g" || !e.ctrlKey || e.metaKey || e.altKey)
        return;
      // Ctrl + G es "buscar siguiente" en el navegador: acá se usa para la grilla
      e.preventDefault();
      setVisible((v) => !v);
      setToast(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setToast(false), TOAST_MS);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <>
      {visible && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[90]">
          <div className="container grid h-full grid-cols-4 gap-3 md:grid-cols-6 md:gap-8">
            {Array.from({ length: COLUMNS }, (_, i) => (
              <div
                key={i}
                className={`h-full bg-red-500/10 ${i >= 4 ? "hidden md:block" : ""} shadow-[inset_1px_0_0_rgba(239,68,68,0.35),inset_-1px_0_0_rgba(239,68,68,0.35)]`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Aviso chico y pasajero; role="status" lo anuncia a los lectores de pantalla */}
      <p
        role="status"
        className={`pointer-events-none fixed bottom-4 right-4 z-[100] rounded-md bg-basement-white px-3 py-2 font-mono text-[12px] font-medium uppercase text-basement-black transition-opacity duration-300 ${toast ? "opacity-100" : "opacity-0"}`}
      >
        {toast ? `Grid ${visible ? "on" : "off"}` : ""}
      </p>
    </>
  );
};
