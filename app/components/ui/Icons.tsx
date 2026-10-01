import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

const base = {
  "aria-hidden": true,
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Flecha hacia la izquierda con cola (Go back) */
export const ArrowLeft = (props: IconProps) => (
  <svg
    {...base}
    viewBox="0 0 14 14"
    strokeWidth="1.25"
    className="h-[10px] w-[10px] shrink-0 md:h-[14px] md:w-[14px]"
    {...props}
  >
    <path d="M13 7H1M6.5 1.5 1 7l5.5 5.5" />
  </svg>
);

/** Chevron: apunta a la izquierda; `direction="next"` lo espeja (flechas del carrusel) */
export const Chevron = ({
  direction = "prev",
  className,
  ...props
}: IconProps & { direction?: "prev" | "next" }) => (
  <svg
    {...base}
    viewBox="0 0 16 16"
    strokeWidth="1.5"
    strokeLinecap="square"
    className={["h-4 w-4", direction === "next" ? "rotate-180" : "", className]
      .filter(Boolean)
      .join(" ")}
    {...props}
  >
    <path d="M10 2 4 8l6 6" />
  </svg>
);
