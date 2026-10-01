import React from "react";
import clsx from "clsx";

const spacing = {
  none: "",
  sm: "mt-12 md:mt-20",
  md: "mt-20 md:mt-section-md",
  lg: "mt-section-md md:mt-section-lg",
} as const;

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Separación con el bloque anterior (ritmo vertical del sistema) */
  space?: keyof typeof spacing;
}

/** Bloque vertical de una página: da el ritmo entre secciones sin repetir márgenes sueltos en cada página */
export const Section = ({
  space = "md",
  className,
  ...props
}: SectionProps) => (
  <section className={clsx(spacing[space], className)} {...props} />
);
