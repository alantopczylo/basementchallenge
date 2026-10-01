/**
 * Textos y links globales del sitio. Es el contenido por defecto (y el de respaldo si Sanity no está configurado);
 * en Sanity se edita en el documento "Site settings".
 */
export interface SiteLink {
  label: string;
  href: string;
}

/** Textos fijos de la interfaz (botones, etiquetas): editables en Sanity dentro de "Site settings" */
export interface UiTexts {
  skipToContent: string;
  allPosts: string;
  readMore: string;
  readFullPost: string;
  loadMore: string;
  relatedPosts: string;
  viewPost: string;
  goBack: string;
  previous: string;
  next: string;
}

export const DEFAULT_UI: UiTexts = {
  skipToContent: "Skip to content",
  allPosts: "All posts",
  readMore: "Read more",
  readFullPost: "Read full blog post",
  loadMore: "Load more",
  relatedPosts: "Related Posts",
  viewPost: "View post",
  goBack: "Go back",
  previous: "Previous",
  next: "Next",
};

export interface SiteSettings {
  ui: UiTexts;
  heroTitle: string;
  /** Slug del post destacado de la home */
  featuredSlug: string;
  featuredExcerpt: string;
  postsTitle: string;
  navLinks: SiteLink[];
  ctaLabel: string;
  ctaHref: string;
  footerWebsite: SiteLink[];
  footerLegal: SiteLink[];
  footerConnect: SiteLink[];
  copyright: string;
  rights: string;
  membership: string;
  seoTitle: string;
  seoDescription: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  ui: DEFAULT_UI,
  heroTitle:
    "Research, insights, and the science behind building brands & websites.",
  featuredSlug: "creating-daylight-the-devex",
  featuredExcerpt:
    "We’re thrilled to unveil our latest advancement in gene therapy, poised to transform the landscape of treatment for rare genetic conditions.",
  postsTitle: "Knowledge Is Meant to Be Shared",
  navLinks: [
    { label: "Showcase", href: "/showcase" },
    { label: "Services", href: "/services" },
    { label: "People", href: "/people" },
    { label: "Laboratory", href: "/laboratory" },
    { label: "Blog", href: "/blog" },
    { label: "Ventures", href: "/ventures" },
  ],
  ctaLabel: "Contact us",
  ctaHref: "/contact",
  footerWebsite: [
    { label: "Home", href: "/blog" },
    { label: "Services", href: "/services" },
    { label: "Showcase", href: "/showcase" },
    { label: "People", href: "/people" },
    { label: "Blog", href: "/blog" },
    { label: "Lab", href: "/laboratory" },
  ],
  footerLegal: [
    { label: "Terms of Use", href: "/terms-of-use" },
    { label: "Terms and Conditions", href: "/terms-and-conditions" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Trust Center", href: "/trust-center" },
  ],
  footerConnect: [
    { label: "X (Twitter)", href: "https://x.com" },
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Github", href: "https://github.com" },
  ],
  copyright: "© basement.studio LLC 2026.",
  rights: "All rights reserved.",
  membership: "Proud Member of SoDA",
  seoTitle: "Basement - A Modern Blog Platform",
  seoDescription:
    "A beautifully designed blog platform built with Next.js, TypeScript, and Sanity CMS.",
};

/** Filtros de la home por defecto (en Sanity salen de los documentos "Tag") */
export const DEFAULT_TAGS = ["Web Design", "Development", "Branding"];
