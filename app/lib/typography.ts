/**
 * Type-kit: única fuente de verdad de los estilos de texto.
 * Cada variante apunta a una clase definida en `styles/globals.css` (tamaño, peso, interlineado y tracking de Figma,
 * con sus cambios por breakpoint). Se consume con <Text variant="…"> o con `typeClass("…")` cuando hace falta la clase suelta.
 */
import clsx from "clsx";

export const typeVariants = {
  /** Display / H1: 76px (tablet 56, mobile 40), Geist 600 */
  h1: "h1",
  /** H2: 38px (mobile 24), Geist 600 */
  h2: "h2",
  /** H3: 24px, Geist 600 */
  h3: "h3",
  /** H3 regular: 24px (mobile 20), Geist 400 */
  h3Regular: "h3-regular",
  /** Cuerpo 16px, Geist 600 / 500 / 400 */
  bodySemibold: "body-semibold",
  bodyMedium: "body-medium",
  body: "body-regular",
  /** Cuerpo mobile 14px */
  bodySemiboldSm: "body-semibold-sm",
  bodySm: "body-regular-sm",
  /** Geist Mono 14px: regular y medium (mayúsculas, botones y filtros) */
  monoRegular: "mono-regular",
  monoMedium: "mono-medium",
  /** Meta 13px Geist 600 (fechas, tags) */
  meta: "meta",
  /** Caption 13px Geist 600 en mayúsculas */
  caption: "caption",
} as const;

export type TypeVariant = keyof typeof typeVariants;

/** Clase de tipografía para una variante (para elementos que no pueden ser <Text>, p. ej. links de Next) */
export const typeClass = (
  variant: TypeVariant,
  ...extra: Parameters<typeof clsx>
) => clsx(typeVariants[variant], ...extra);

/** Etiqueta HTML semántica por defecto de cada variante */
export const defaultTag: Record<
  TypeVariant,
  keyof React.JSX.IntrinsicElements
> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h3Regular: "p",
  bodySemibold: "p",
  bodyMedium: "p",
  body: "p",
  bodySemiboldSm: "p",
  bodySm: "p",
  monoRegular: "span",
  monoMedium: "span",
  meta: "span",
  caption: "span",
};
