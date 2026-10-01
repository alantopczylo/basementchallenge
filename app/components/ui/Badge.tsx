import React from "react";
import clsx from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "dark" | "light" | "grey";
  children: React.ReactNode;
}


export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "dark", className, children, ...props }, ref) => {
    const baseStyles = clsx(
      "font-mono font-medium text-mono uppercase text-center leading-[0.9] whitespace-nowrap",
      "inline-flex h-[21px] items-center justify-center",
      "rounded-sm px-2 py-1",
      "transition-all duration-300",
    );

    const variantStyles = {
      dark: "bg-basement-orange text-basement-black",
      light: "bg-basement-white text-basement-black",
      grey: "bg-basement-grey text-basement-white",
    };

    return (
      <span
        ref={ref}
        data-aim
        className={clsx(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";
