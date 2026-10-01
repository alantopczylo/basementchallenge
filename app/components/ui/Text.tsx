import React from "react";
import clsx from "clsx";
import { defaultTag, typeVariants, type TypeVariant } from "@/lib/typography";

/** Colores de texto del sistema (tokens de tailwind.config) */
const tones = {
  white: "text-basement-white",
  muted: "text-basement-white/75",
  grey: "text-basement-grey",
  orange: "text-basement-orange",
  black: "text-basement-black",
  inherit: "",
} as const;

export type TextTone = keyof typeof tones;

type TextOwnProps<T extends React.ElementType> = {
  /** Variante del type-kit */
  variant: TypeVariant;
  /** Etiqueta a renderizar; por defecto la semántica de la variante (h2 → <h2>, body → <p>) */
  as?: T;
  tone?: TextTone;
};

export type TextProps<T extends React.ElementType = "p"> = TextOwnProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof TextOwnProps<T>>;

export const Text = <T extends React.ElementType = "p">({
  variant,
  as,
  tone = "inherit",
  className,
  ...props
}: TextProps<T>) => {
  const Tag: React.ElementType = as ?? defaultTag[variant];
  return (
    <Tag
      className={clsx(typeVariants[variant], tones[tone], className)}
      {...props}
    />
  );
};
