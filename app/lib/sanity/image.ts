import imageUrlBuilder from "@sanity/image-url";
import { dataset, projectId } from "./client";

const builder = projectId ? imageUrlBuilder({ projectId, dataset }) : null;

/** Imagen de Sanity (con recorte de hotspot) */
export interface SanityImage {
  asset?: { _ref?: string; _id?: string };
  alt?: string;
}

/**
 * URL optimizada de una imagen de Sanity: la CDN la redimensiona y la sirve en WebP/AVIF (`auto=format`).
 * `width` es el ancho final en px (pensado para pantallas retina: pedir ~2x el ancho en CSS).
 */
export const imageUrl = (source: SanityImage | undefined, width: number) => {
  if (!builder || !source?.asset) return undefined;
  return builder
    .image(source as never)
    .width(width)
    .auto("format")
    .quality(80)
    .url();
};
