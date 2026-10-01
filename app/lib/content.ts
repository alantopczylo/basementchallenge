import { cache } from "react";
import { POSTS, type Post, type PostBlock } from "@/lib/posts";
import {
  DEFAULT_SETTINGS,
  DEFAULT_UI,
  DEFAULT_TAGS,
  type SiteSettings,
} from "@/lib/settings";
import { draftMode } from "next/headers";
import {
  client,
  hasSanity,
  previewClient,
  SANITY_TAG,
} from "@/lib/sanity/client";
import { imageUrl, type SanityImage } from "@/lib/sanity/image";
import { POSTS_QUERY, SETTINGS_QUERY, TAGS_QUERY } from "@/lib/sanity/queries";

/**
 * Capa de contenido: la única que sabe de dónde vienen los datos.
 * Con Sanity configurado (NEXT_PUBLIC_SANITY_PROJECT_ID) lee de ahí; si falta el proyecto, no hay contenido cargado o
 * la consulta falla, usa el contenido local (lib/posts.ts, lib/settings.ts) para que el sitio nunca quede vacío.
 */

interface RawBlock {
  _type: "section" | "quote" | "paragraph";
  title?: string;
  lead?: string;
  leadSize?: "lg" | "sm";
  body?: string;
  bullets?: string[];
  text?: string;
  author?: string;
  role?: string;
}

interface RawPost {
  slug: string;
  title: string;
  date: string;
  tags?: string[];
  cover?: SanityImage;
  image?: SanityImage;
  summary: string;
  intro: string;
  authors?: string[];
  content?: RawBlock[];
  prev?: { label?: string; slug?: string };
  next?: { label?: string; slug?: string };
}

/** ¿Está activo el modo draft (vista previa de borradores)? Fuera de un request (build) es siempre que no */
const isPreview = async () => {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false;
  }
};

const fetchSanity = async <T>(query: string): Promise<T | null> => {
  const preview = (await isPreview()) && !!previewClient;
  const source = preview ? previewClient : client;
  if (!source) return null;
  try {
    return await source.fetch<T>(
      query,
      {},
      // Vista previa: siempre fresco. Normal: Next cachea la respuesta y se renueva cada 60 s o al instante cuando el
      // webhook invalida la etiqueta
      (preview
        ? { cache: "no-store" }
        : { next: { revalidate: 60, tags: [SANITY_TAG] } }) as never,
    );
  } catch (error) {
    console.error(
      "[sanity] consulta fallida, se usa el contenido local",
      error,
    );
    return null;
  }
};

/** "2025-01-03" -> "Jan 3, 2025" (en UTC: la fecha no se corre según la zona horaria del servidor) */
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));

const toBlock = (b: RawBlock): PostBlock | null => {
  if (b._type === "section" && b.title && b.lead && b.body)
    return {
      type: "section",
      title: b.title,
      lead: b.lead,
      leadSize: b.leadSize ?? "lg",
      body: b.body,
      bullets: b.bullets?.length ? b.bullets : undefined,
    };
  if (b._type === "quote" && b.text && b.author)
    return {
      type: "quote",
      text: b.text,
      author: b.author,
      role: b.role ?? "",
    };
  if (b._type === "paragraph" && b.text)
    return { type: "paragraph", text: b.text };
  return null;
};

const toPost = (r: RawPost): Post => {
  const nav: Post["nav"] = {};
  if (r.prev?.slug && r.prev.label)
    nav.prev = { slug: r.prev.slug, label: r.prev.label };
  if (r.next?.slug && r.next.label)
    nav.next = { slug: r.next.slug, label: r.next.label };
  return {
    slug: r.slug,
    date: formatDate(r.date),
    title: r.title,
    tags: r.tags ?? [],
    // Card ~436px de ancho: se pide al doble para pantallas retina. El detalle ocupa hasta 1372px.
    cover: imageUrl(r.cover, 900),
    image: imageUrl(r.image, 2400) ?? imageUrl(r.cover, 2400),
    summary: r.summary,
    intro: r.intro,
    authors: r.authors?.length ? r.authors : undefined,
    content: r.content?.map(toBlock).filter((b): b is PostBlock => !!b),
    nav: nav.prev || nav.next ? nav : undefined,
  };
};

/** Todos los posts (incluido el destacado), en el orden de la lista */
export const getPosts = cache(async (): Promise<Post[]> => {
  if (!hasSanity) return POSTS;
  const raw = await fetchSanity<RawPost[]>(POSTS_QUERY);
  return raw?.length ? raw.map(toPost) : POSTS;
});

export const getPost = async (slug: string) =>
  (await getPosts()).find((p) => p.slug === slug);

export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!hasSanity) return DEFAULT_SETTINGS;
  const raw = await fetchSanity<Partial<SiteSettings> | null>(SETTINGS_QUERY);
  if (!raw) return DEFAULT_SETTINGS;
  // Los campos que falten en Sanity caen al valor por defecto (null/vacío no pisa)
  const merged = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  for (const [key, value] of Object.entries(raw)) {
    if (key === "ui") continue;
    const empty =
      value == null || value === "" || (Array.isArray(value) && !value.length);
    if (!empty) merged[key] = value;
  }
  // Los textos de interfaz se combinan uno por uno: un campo vacío en Sanity usa el de por defecto
  const ui: Record<string, string> = { ...DEFAULT_UI };
  for (const [key, value] of Object.entries(raw.ui ?? {}))
    if (typeof value === "string" && value.trim()) ui[key] = value;
  merged.ui = ui;
  return merged as unknown as SiteSettings;
});

/** El post destacado de la home: el elegido en "Site settings", o el marcado por defecto */
export const getFeaturedPost = async () => {
  const [posts, settings] = await Promise.all([getPosts(), getSettings()]);
  return posts.find((p) => p.slug === settings.featuredSlug) ?? posts[0];
};

/** Filtros de la home (sin "All posts", que agrega el componente) */
export const getTags = cache(async (): Promise<string[]> => {
  if (!hasSanity) return DEFAULT_TAGS;
  const tags = await fetchSanity<string[]>(TAGS_QUERY);
  return tags?.length ? tags : DEFAULT_TAGS;
});
