import React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { Badge, TagList } from "@/components/ui";
import { MaskText } from "@/components/common/MaskText";

export interface PostCardProps {
  href: string;
  date: string;
  title: string; // "\n" fuerza salto de línea
  tags: string[];
  /** Imagen de portada (opcional: las cards sin imagen quedan más bajas) */
  image?: string;
  /** Fondo CSS temporal mientras no exista el asset de la portada */
  imagePlaceholder?: string;
  /** light: sobre fondo blanco (listado) | dark: sobre fondo negro (relacionados) */
  theme?: "light" | "dark";
  /** Texto del botón (editable en Sanity) */
  readMoreLabel?: string;
  className?: string;
}

// Card 436 x 400: padding 24, radius 16, fondo = el de la sección (opaco, para que no se vean los puntos detrás), contenido (gap 24) + botón a 60px
export const PostCard = ({
  href,
  date,
  title,
  tags,
  image,
  imagePlaceholder,
  theme = "light",
  readMoreLabel = "Read more",
  className,
}: PostCardProps) => {
  const dark = theme === "dark";
  return (
    <article
      data-reveal="unit"
      data-unit
      className={clsx(
        "group relative flex flex-col justify-between rounded-2xl p-4 md:p-6",
        dark ? "bg-[#0f0f0f]" : "bg-basement-white",
        // Con portada la card mide exactamente 400px (el título se limita a 2 líneas para que no desborde)
        (image || imagePlaceholder) && "md:h-[400px]",
        className,
      )}
      style={{
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,${dark ? 0.1 : 0.6}), 0px 3px 15px 0px #1212120D`,
      }}
    >
      <div className="flex flex-col gap-4 md:gap-6">
        {(image || imagePlaceholder) && (
          <div
            data-fluid
            className="fluid-cover relative h-[110px] w-full overflow-hidden rounded-[6px] md:aspect-[388/137] md:h-auto"
            style={
              imagePlaceholder ? { background: imagePlaceholder } : undefined
            }
          >
            {image && (
              <Image
                src={image}
                alt=""
                fill
                crossOrigin="anonymous"
                sizes="(min-width: 1024px) 388px, 100vw"
                className="object-cover"
              />
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 md:gap-4">
          <MaskText>
            <span className="meta block text-basement-grey">{date}</span>
          </MaskText>
          <MaskText pad="6px">
            <h3
              className={clsx(
                "h3 whitespace-pre-line md:line-clamp-2",
                // En la lista arrastrable (dark) el título no cambia: el click lo indica el cursor y no se confunde con el arrastre
                dark
                  ? "text-basement-white"
                  : "text-basement-black transition-colors duration-300 group-hover:text-basement-orange",
              )}
            >
              {title}
            </h3>
          </MaskText>
          <MaskText>
            <TagList tags={tags} variant={dark ? "dark" : "light"} />
          </MaskText>
        </div>
      </div>

      {/* Link "estirado": el ::after cubre toda la card, así tocar en cualquier parte abre el post */}
      <Link
        href={href}
        className="mt-[32px] flex w-fit rounded-[4px] transition-none after:absolute after:inset-0 after:rounded-2xl md:mt-[60px]"
      >
        <MaskText inline flex>
          <Badge variant={dark ? "dark" : "light"}>{readMoreLabel}</Badge>
        </MaskText>
        {/* Texto descriptivo para lectores de pantalla y buscadores: "Read more" solo no dice a dónde lleva */}
        <span className="sr-only">: {title.replace(/\n/g, " ")}</span>
      </Link>
    </article>
  );
};
