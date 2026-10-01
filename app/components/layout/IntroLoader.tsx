"use client";

import { useEffect } from "react";
import { enter, HOME_PATH, turnOn } from "@/lib/intro";

/** Espera inicial en negro antes de encender (ms): alcanza para que hidrate y pinte el fondo */
const START_MS = 250;
/** Cuándo empieza a enfocar el hero y arrancan título/navbar/reveals, en ms desde que se enciende el sol */
const PAGE_IN_MS = 450;
/** Lo que dura el enfoque del hero desde que se enciende (ms); delay + duración de `focus-in` en globals.css */
const FOCUS_MS = 2900;


export const IntroLoader = () => {
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      turnOn();
      enter();
      return;
    }
    // Otras páginas no tienen sol que encender: entran con el mosaico de PageTransition
    if (window.location.pathname !== HOME_PATH) {
      turnOn();
      enter();
      return;
    }
    const html = document.documentElement;
    let reveal = 0;
    let unfocus = 0;
    const start = window.setTimeout(() => {
      html.classList.add("focus-in");
      turnOn();
      reveal = window.setTimeout(enter, PAGE_IN_MS);
      unfocus = window.setTimeout(
        () => html.classList.remove("focus-in"),
        FOCUS_MS,
      );
    }, START_MS);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(reveal);
      window.clearTimeout(unfocus);
      html.classList.remove("focus-in");
    };
  }, []);

  return null;
};
