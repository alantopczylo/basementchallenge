import React from "react";
import clsx from "clsx";


export const MaskText = ({
  children,
  inline = false,
  flex = false,
  pad = "0.14em",
  className,
}: {
  children: React.ReactNode;
  /** inline-block (links, botones) en vez de bloque (títulos, párrafos) */
  inline?: boolean;
  /** El contenido es un elemento inline-flex (ej. un botón): evita la caja de línea que le suma alto */
  flex?: boolean;
  /** Aire arriba y abajo dentro del recorte (se compensa con margen negativo): más si el texto tiene interlineado justo */
  pad?: string;
  className?: string;
}) => (
  <span
    className={clsx(
      flex ? "inline-flex" : inline ? "inline-block" : "block",
      "[overflow:clip]",
      className,
    )}
    style={{ marginBlock: `calc(${pad} * -1)`, paddingBlock: pad }}
  >
    <span
      className={clsx(
        "hero-word",
        flex ? "flex" : inline ? "inline-block" : "block",
      )}
    >
      {children}
    </span>
  </span>
);
