import React from "react";
import clsx from "clsx";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** dark: sobre fondo oscuro (hero) | light: sobre fondo claro (cards blancas) */
  variant?: "dark" | "light";
  children: React.ReactNode;
}

// Figma: Geist 600 13px, lh 100%, padding horizontal 2px (.meta en globals.css)
export const Tag = ({
  variant = "dark",
  className,
  children,
  ...props
}: TagProps) => (
  <span
    className={clsx(
      "meta inline-block rounded-[2px] px-[2px]",
      variant === "dark"
        ? "bg-basement-dark-grey text-basement-white/80"
        : "bg-basement-white text-basement-light-grey",
      className,
    )}
    {...props}
  >
    {children}
  </span>
);

export interface TagListProps {
  tags: string[];
  variant?: TagProps["variant"];
  className?: string;
}

// gap 4px entre tags
export const TagList = ({ tags, variant, className }: TagListProps) => (
  <ul className={clsx("flex flex-wrap items-center gap-1", className)}>
    {tags.map((tag) => (
      <li key={tag} className="flex">
        <Tag variant={variant}>{tag}</Tag>
      </li>
    ))}
  </ul>
);
