/** Segundos, contados desde que la página empieza a entrar en cuadro (lib/intro.ts), antes de que el hero empiece a moverse */
export const INTRO = 0.1;

/** Segundos que el sol (HeroEllipse) le saca de ventaja al resto de la carga: el título y la navbar arrancan cuando ya va por la mitad */
export const LOAD_OFFSET = INTRO + 0.45;

/** Tiempos del reveal por palabras (HeroTitle) — el resto de la carga se ancla a estos valores */
export const WORD_REVEAL = {
  /** ms antes de la primera palabra */
  delay: 80 + LOAD_OFFSET * 1000,
  /** ms que dura cada palabra */
  duration: 900,
  /** ms entre palabra y palabra */
  stagger: 35,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

/** Cuánto antes de que termine el título arranca lo que sigue (la card entra cuando las últimas palabras ya aterrizan) */
export const HERO_OVERLAP = 0.9;

/** Segundo en que termina el reveal de un título de `words` palabras */
export const wordRevealEnd = (
  words: number,
  delayMs: number = WORD_REVEAL.delay,
) =>
  (delayMs +
    Math.max(0, words - 1) * WORD_REVEAL.stagger +
    WORD_REVEAL.duration) /
  1000;

/**
 * Guion de la página de un post (components/blog/PostStory): segundos desde que la página entra en cuadro.
 * Cuenta una historia en capítulos: marco (volver + línea) → título → resumen → intro → metadatos → imagen.
 * El título lo mueve HeroTitle (por eso `title` coincide con su retraso suave) y la imagen FluidImage (usa `image`).
 */
export const STORY = {
  frame: 0,
  title: 0.1,
  summary: 0.45,
  intro: 0.65,
  meta: 0.95,
  image: 1.05,
} as const;
