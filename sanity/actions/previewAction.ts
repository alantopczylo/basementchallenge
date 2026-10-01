import type { DocumentActionComponent } from "sanity";

/**
 * Botón "Open preview" del estudio: abre el sitio en modo draft (ve los borradores sin publicar).
 * Variables del estudio (en .env o .env.local):
 *   SANITY_STUDIO_SITE_URL         (por defecto http://localhost:3000)
 *   SANITY_STUDIO_PREVIEW_SECRET   (el mismo valor que SANITY_PREVIEW_SECRET del sitio)
 */
const SITE = process.env.SANITY_STUDIO_SITE_URL || "http://localhost:3000";
const SECRET = process.env.SANITY_STUDIO_PREVIEW_SECRET || "";

export const PreviewAction: DocumentActionComponent = (props) => {
  const doc = (props.draft ?? props.published) as
    { slug?: { current?: string } } | null | undefined;
  return {
    label: "Open preview",
    title: SECRET
      ? "Open the site in draft mode"
      : "Set SANITY_STUDIO_PREVIEW_SECRET to enable the preview",
    disabled: !SECRET,
    onHandle: () => {
      const url = new URL("/api/draft/enable", SITE);
      url.searchParams.set("secret", SECRET);
      if (doc?.slug?.current) url.searchParams.set("slug", doc.slug.current);
      window.open(url.toString(), "_blank");
      props.onComplete();
    },
  };
};
