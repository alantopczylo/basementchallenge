import React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { Badge, TagList, Text } from "@/components/ui";
import { noiseBackground } from "@/lib/noise";

export interface FeaturedPostCardProps {
  href: string;
  /** Opcional: sin imagen el texto ocupa todo el ancho de la card */
  image?: string;
  imageAlt?: string;
  date: string;
  title: string; // "\n" fuerza salto de línea
  tags?: string[];
  excerpt: string;
  ctaLabel?: string;
  className?: string;
}

export const FeaturedPostCard: React.FC<FeaturedPostCardProps> = ({
  href,
  image,
  imageAlt = "",
  date,
  title,
  tags = [],
  excerpt,
  ctaLabel = "Read full blog post",
  className,
}) => (
  <article
    data-reveal="move"
    className={clsx(
      "relative mx-auto flex w-full max-w-[902px] flex-col gap-4 rounded-2xl min-h-[360px] p-4 md:min-h-0 md:gap-6 md:p-2 lg:min-h-[394px] lg:flex-row lg:items-center lg:gap-12 lg:py-2 lg:pl-4 lg:pr-2",
      className,
    )}
  >
    {/* Fondo de vidrio en una capa aparte (el blur no envuelve a la imagen); borde como inset ring para no alterar el layout */}
    <span
      aria-hidden
      data-reveal="fade"
      className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-[15px]"
      style={{
        background: "#3A3A3A40",
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.1), 0px 3px 15px 0px #1212120D",
      }}
    />

    {/* Monotone noise: size 0.25, negro 10% */}
    <span
      aria-hidden
      data-reveal="fade"
      data-reveal-opacity="0.2"
      className="pointer-events-none absolute inset-0 rounded-2xl"
      style={{
        backgroundImage: noiseBackground(1.6),
        backgroundSize: "200px 200px",
        // Oculto hasta la entrada (--ro lo pone en 0 el CSS de data-reveal); en reposo vale 0.2
        opacity: "var(--ro, 0.2)",
      }}
    />

    {/* Imagen 482.74 x 359.70, radius 6 (opcional) */}
    {image && (
      <div
        data-reveal="fade"
        className="relative h-[110px] w-full shrink-0 md:h-auto md:aspect-[2.1] lg:aspect-[483/360] md:block overflow-hidden rounded-[6px] lg:w-[483px]"
      >
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="(min-width: 1024px) 483px, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        {/* Monotone noise de la imagen: size 0.3, 2% */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: noiseBackground(1.4),
            backgroundSize: "200px 200px",
            opacity: 0.04,
          }}
        />
      </div>
    )}

    {/* Contenido 325px, gap 16 */}
    <div
      data-reveal="fade"
      className={clsx(
        "relative flex w-full flex-1 flex-col gap-2 md:flex-none md:gap-4 md:px-2 md:pb-2 lg:p-0",
        image ? "lg:w-[325px]" : "lg:max-w-[560px] lg:py-6 lg:pr-6",
      )}
    >
      <Text variant="meta" tone="muted">
        {date}
      </Text>

      <Text variant="h2" tone="white" className="whitespace-pre-line">
        {title}
      </Text>

      {tags.length > 0 && <TagList tags={tags} variant="dark" />}

      <p className="body-regular-sm text-basement-white/75 md:hidden">
        {excerpt}
      </p>
      <p className="body-regular hidden text-basement-white/75 md:block">
        {excerpt}
      </p>

      <Link href={href} className="mt-auto flex w-fit md:mt-0 md:block">
        <Badge variant="dark">{ctaLabel}</Badge>
      </Link>
    </div>

    {/* Toda la card es clickeable (el botón sigue siendo el link accesible) */}
    <Link
      href={href}
      aria-hidden
      tabIndex={-1}
      className="absolute inset-0 rounded-2xl"
    />
  </article>
);
