"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { withPageTransition } from "@/components/common/PageTransition";

// Cantidad de páginas de post que se abrieron en esta visita (navegación sin recargar)
let postViews = 0;

/**
 * "Go back": vuelve a la página anterior del historial (el post del que venís, o la home) en vez de ir siempre a `href`.
 * Si se entró directo a este post (link externo, pestaña nueva) no hay a dónde volver y va a `href`.
 */
export const BackLink = ({
  href,
  className,
  children,
  ...rest
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) => {
  const router = useRouter();
  useEffect(() => {
    postViews += 1;
  }, []);

  return (
    <Link
      href={href}
      className={className}
      {...rest}
      data-no-transition
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        const internal =
          postViews > 1 ||
          (document.referrer !== "" &&
            new URL(document.referrer).origin === location.origin);
        e.preventDefault();
        // vuelve a la página anterior si la hay; si se entró directo a este post, va a `href`
        if (internal && window.history.length > 1)
          withPageTransition(() => router.back());
        else withPageTransition(() => router.push(href));
      }}
    >
      {children}
    </Link>
  );
};
