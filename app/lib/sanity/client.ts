import { createClient } from "@sanity/client";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

/** Sin `projectId` el sitio funciona con el contenido local (lib/posts.ts y lib/settings.ts) */
export const hasSanity = Boolean(projectId);

export const client = hasSanity
  ? createClient({
      projectId,
      dataset,
      apiVersion: "2025-01-01",
      // CDN para lecturas publicadas: rápido y barato; el contenido nuevo llega por revalidación (ver api/revalidate)
      useCdn: true,
      perspective: "published",
    })
  : null;

/**
 * Cliente de vista previa: lee también los borradores (sin publicar). Necesita un token de solo lectura
 * (SANITY_API_READ_TOKEN) y solo se usa cuando el modo draft de Next está activo; nunca llega al navegador.
 */
const readToken = process.env.SANITY_API_READ_TOKEN;
export const previewClient =
  hasSanity && readToken
    ? createClient({
        projectId,
        dataset,
        apiVersion: "2025-02-19",
        useCdn: false,
        token: readToken,
        perspective: "drafts",
      })
    : null;

/** Etiqueta de caché de Next: el webhook de Sanity la invalida y los cambios se ven al instante */
export const SANITY_TAG = "sanity";
