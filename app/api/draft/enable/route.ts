import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

/**
 * Activa la vista previa de borradores y redirige al contenido.
 * Se llama desde el botón "Open preview" del estudio: /api/draft/enable?secret=…&slug=mi-post
 * Sin SANITY_PREVIEW_SECRET configurado la vista previa queda desactivada.
 */
export const GET = async (req: NextRequest) => {
  const secret = process.env.SANITY_PREVIEW_SECRET;
  const params = req.nextUrl.searchParams;
  if (!secret || params.get("secret") !== secret)
    return new Response("Invalid secret", { status: 401 });

  (await draftMode()).enable();
  // Solo slugs simples: evita redirigir a otras rutas o a otros sitios
  const slug = params.get("slug") ?? "";
  redirect(/^[a-z0-9-]+$/.test(slug) ? `/blog/${slug}` : "/blog");
};
