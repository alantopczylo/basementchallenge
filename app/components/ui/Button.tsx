import React from "react";
import clsx from "clsx";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "dark" | "light";
  children: React.ReactNode;
}

// Estilos en globals.css (.btn, .btn-dark, .btn-light) para reutilizarlos en links
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "dark", className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "btn",
        variant === "dark" ? "btn-dark" : "btn-light",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);

Button.displayName = "Button";
