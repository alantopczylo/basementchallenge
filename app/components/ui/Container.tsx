import React from "react";
import clsx from "clsx";

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  /** Grilla de 6 columnas en desktop (las páginas de detalle usan columnas para alinear contenido) */
  grid?: boolean;
}

/**
 * Contenedor de página: mismo ancho que la navbar (máx. 1372px, 12px de margen por lado en mobile y 32px desde tablet).
 * El ancho vive en `.container` (globals.css); acá se le suma la grilla opcional.
 */
export const Container = React.forwardRef<HTMLElement, ContainerProps>(
  ({ as: Tag = "div", grid = false, className, ...props }, ref) => (
    <Tag
      ref={ref}
      className={clsx(
        "container",
        grid && "lg:grid lg:grid-cols-6 lg:gap-8",
        className,
      )}
      {...props}
    />
  ),
);

Container.displayName = "Container";
