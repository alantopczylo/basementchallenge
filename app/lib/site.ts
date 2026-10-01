import type { FooterProps } from "@/components/layout/Footer";
import type { NavbarProps } from "@/components/layout/Navbar";
import type { SiteSettings } from "@/lib/settings";

/** Ajustes del sitio -> props de la navbar */
export const navbarProps = (s: SiteSettings): NavbarProps => ({
  links: s.navLinks,
  ctaLabel: s.ctaLabel,
  ctaHref: s.ctaHref,
});

/** Ajustes del sitio -> props del footer */
export const footerProps = (s: SiteSettings): FooterProps => ({
  website: s.footerWebsite,
  legal: s.footerLegal,
  connect: s.footerConnect,
  copyright: s.copyright,
  rights: s.rights,
  membership: s.membership,
});

/**
 * Rutas que existen hoy (el resto de los links de la navbar y el footer todavía no tiene página y da 404).
 * Los links a rutas que no existen no se precargan: precargar un 404 ensucia la consola y Lighthouse lo marca.
 */
export const isLiveRoute = (href: string) =>
  href === "/blog" ||
  href.startsWith("/blog/") ||
  href.startsWith("/blog?") ||
  href === "/design-system" ||
  href.startsWith("#");

/**
 * URL pública del sitio (para metadata, sitemap y robots). En Vercel sale sola del dominio de producción;
 * se puede forzar con NEXT_PUBLIC_SITE_URL (ej. un dominio propio).
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
