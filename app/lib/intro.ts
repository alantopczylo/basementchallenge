/**
 * Estado de la entrada del sitio. El sol se enciende solo (sin click) y el hero, la navbar y el resto esperan a
 * `onLit` / `onEnter` para arrancar, así todo cuenta desde el encendido y no desde la carga.
 * Failsafe: si nadie llama a `turnOn` en 10s (ej. falló el componente de la entrada), se enciende sola para no dejar
 * el sitio escondido.
 */
let lit = false;
let failsafe = 0;
const waiting = new Set<() => void>();

/** Ejecuta `cb` cuando se enciende el sol (o ya, si ya estaba encendido). Devuelve la función para cancelar. */
export const onLit = (cb: () => void) => {
  if (lit) {
    cb();
    return () => {};
  }
  waiting.add(cb);
  if (!failsafe && typeof window !== "undefined") {
    failsafe = window.setTimeout(turnOn, 10000);
  }
  return () => {
    waiting.delete(cb);
  };
};

export function turnOn() {
  if (lit) return;
  lit = true;
  window.clearTimeout(failsafe);
  document.documentElement.setAttribute("data-lit", "");
  const cbs = Array.from(waiting);
  waiting.clear();
  cbs.forEach((cb) => cb());
}

/**
 * Segunda compuerta: la página (título, navbar, reveals) recién "entra" cuando sube la cámara de la intro. El sol
 * (`onLit`) arranca antes, apenas se enciende el sol. Mismo failsafe: si nadie llama a `enter`, entra sola.
 */
let entered = false;
let enterFailsafe = 0;
/** Ruta de la home del sitio: el listado del blog. Es la única con la intro del sol */
export const HOME_PATH = "/blog";

const enterWaiting = new Set<() => void>();

// Transición de página (PageTransition): mientras el mosaico tapa la pantalla, lo que entra en la página nueva espera
// Carga directa (o recarga) de una página que no es la home: no hay intro del sol, así que se abre con el mismo mosaico
// de la transición (PageTransition lo cubre apenas hidrata y lo disuelve); lo que entra espera a que empiece a disolverse
const initialHold =
  typeof window !== "undefined" &&
  window.location.pathname !== HOME_PATH &&
  window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
let held = initialHold;
// La página se abrió con una transición (no es la carga inicial de la home): sus entradas arrancan sin el retraso de la intro
let soft = initialHold;
/** La página se abrió directamente (no desde la home) y arranca tapada por el mosaico */
export const startsHeld = () => initialHold;
// Red de seguridad: si el mosaico no llega a correr, la página entra igual
if (initialHold) window.setTimeout(() => releaseEnter(), 4000);
// (la home conserva su secuencia de siempre)
export const isSoftNav = () =>
  soft &&
  typeof window !== "undefined" &&
  window.location.pathname !== HOME_PATH;
/** Hay una transición de página en curso */
export const isHeld = () => held;
export const holdEnter = () => {
  held = true;
  soft = true;
};
export const releaseEnter = () => {
  held = false;
  if (!entered) return;
  const cbs = Array.from(enterWaiting);
  enterWaiting.clear();
  cbs.forEach((cb) => cb());
};

export const onEnter = (cb: () => void) => {
  if (entered && !held) {
    cb();
    return () => {};
  }
  enterWaiting.add(cb);
  if (!enterFailsafe && typeof window !== "undefined") {
    enterFailsafe = window.setTimeout(enter, 10500);
  }
  return () => {
    enterWaiting.delete(cb);
  };
};

export function enter() {
  if (entered) return;
  entered = true;
  window.clearTimeout(enterFailsafe);
  const cbs = Array.from(enterWaiting);
  enterWaiting.clear();
  cbs.forEach((cb) => cb());
}
