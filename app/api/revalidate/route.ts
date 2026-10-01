import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { SANITY_TAG } from "@/lib/sanity/client";

/**
 * Webhook de Sanity: al publicar o editar contenido invalida la caché y el sitio se actualiza al instante
 * (sin esto igual se renueva solo cada 60 s)`
 */
export const POST = async (req: NextRequest) => {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret || req.nextUrl.searchParams.get("secret") !== secret)
    return NextResponse.json({ ok: false }, { status: 401 });
  revalidateTag(SANITY_TAG);
  return NextResponse.json({ ok: true, revalidated: SANITY_TAG });
};
