import { BackLink } from "./BackLink";
import { HeroTitle } from "@/components/common/HeroTitle";
import React from "react";
import { MaskText } from "@/components/common";
import { ArrowLeft, Container, Text } from "@/components/ui";
import Link from "next/link";

export interface PostHeaderProps {
  title: string; // "\n" fuerza salto de línea
  summary: string;
  /** Admite {{texto|/ruta}} (subrayado con link), {{texto}} (solo subrayado) y :saluting_face: (emoji 🫡 como imagen). Cualquier otro emoji se escribe directo en el texto y lo dibuja el sistema */
  intro: string;
  backHref?: string;
  backLabel?: string;
}

// El emoji 🫡 es nuevo y no se ve en todos los sistemas: se dibuja como SVG inline (Twemoji, CC-BY 4.0, twemoji.twitter.com)
const Salute = () => (
  <svg
    role="img"
    aria-label="🫡"
    viewBox="0 0 36 36"
    className="inline-block h-[1.1em] w-[1.1em] align-[-0.2em]"
  >
    <path
      fill="#FFCC4D"
      d="M36 21c0 8.282-6.718 15-15 15-8.284 0-15-6.718-15-15 0-8.284 6.716-15 15-15 8.282 0 15 6.716 15 15"
    />
    <path
      fill="#F4900C"
      d="M22.864 1.134A1.51 1.51 0 0 0 21.55.004a1.608 1.608 0 0 0-.799.119l-5.775 2.446c-3.314 1.074-3.116.975-3.626 1.281-.915.547-2.007 1.513-3.961 3.377C5.728 8.811.059 9.794.041 15.297.034 17.438 1.698 19.192 4 19.185c2.423-.008 3.816-1.29 4.482-2.159a4.161 4.161 0 0 1 1.52-1.228c3.93-1.875 2.256-3.522 5.185-7.281a.712.712 0 0 0-.226-1.071l6.858-4.024c.608-.357.878-1.004.698-1.674l.095-.051a.505.505 0 0 0 .252-.563z"
    />
    <path
      fill="#B55005"
      d="M22.823 1.239a.348.348 0 0 0-.467-.164l-2.698 1.294a1.741 1.741 0 0 0-.088-1.165 1.524 1.524 0 0 0-.316-.447l-.764.323a.825.825 0 0 1 .444.417c.209.454.062 1.12-.623 1.518l-2.585 1.24c.269-.54.338-1.093.21-1.542a1.476 1.476 0 0 0-.224-.456l-.691.293a.714.714 0 0 1 .242.354c.196.689-.333 1.747-1.56 2.323-1.171.55-1.534 1.431-1.955 2.452-.193.467-.411.996-.734 1.553-.859 1.48-2.983 3.885-3.93 4.816a.35.35 0 1 0 .491.499c.915-.898 3.111-3.354 4.045-4.963l.004-.007.001-.001c.903-1.66 1.893-2.288 2.478-2.17.419.084.529.545.557.813a.35.35 0 0 0 .696-.072c-.08-.77-.497-1.303-1.116-1.427-.401-.082-.919.021-1.478.403.274-.542.606-.963 1.24-1.26.05-.023.09-.053.137-.077.01-.004.021-.002.032-.007l8.348-4.004c-.002-.009 0-.017-.003-.026l.094-.051a.5.5 0 0 0 .246-.325.335.335 0 0 0-.033-.134z"
    />
    <path
      fill="#65471B"
      d="M21 29.25c-4.076 0-6.156-.508-6.243-.53a1.001 1.001 0 0 1-.728-1.213 1.005 1.005 0 0 1 1.211-.728c.039.01 1.982.471 5.759.471 3.796 0 5.74-.466 5.76-.471a.999.999 0 0 1 .483 1.94c-.086.023-2.166.531-6.242.531zM18 14h-4a1 1 0 0 0 0 2h.519c-.319.532-.519 1.228-.519 2 0 1.658.896 3 2 3s2-1.343 2-3c0-.772-.2-1.468-.519-2H18a1 1 0 0 0 0-2zm10 0h-4a1 1 0 0 0 0 2h.519c-.319.532-.519 1.228-.519 2 0 1.657.896 3 2 3s2-1.342 2-3c0-.772-.2-1.468-.519-2H28a1 1 0 0 0 0-2z"
    />
  </svg>
);

// Convierte las marcas del texto: {{subrayado|/link}} y :saluting_face:
const renderIntro = (text: string): React.ReactNode[] =>
  text.split(/(\{\{.*?\}\}|:saluting_face:)/g).map((part, i) => {
    if (part === ":saluting_face:") return <Salute key={i} />;
    if (part.startsWith("{{")) {
      const [label, href] = part.slice(2, -2).split("|");
      if (!href) return <u key={i}>{label}</u>;
      return (
        <Link
          key={i}
          href={href}
          className="underline transition-colors duration-300 hover:text-basement-orange"
        >
          {label}
        </Link>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });

/**
 * Header de un post (Figma: caja 1371 x 316, gap 60):
 * - "Go back" (flecha + Geist Mono 500 14px uppercase) + línea de 1px basement-grey, 8px de gap (28px en total)
 * - 60px abajo: título a la izquierda (H2 38px, 304px de ancho) y a la derecha un frame de 553px
 *   (gap 24) con el resumen (24px regular) y la intro (16px regular). Fila de 1255px máx.
 */
export const PostHeader = ({
  title,
  summary,
  intro,
  backHref = "/blog",
  backLabel = "Go back",
}: PostHeaderProps) => {
  // Los "\n" del título fuerzan salto de línea: se pasan como índices de palabra
  const breaks: number[] = [];
  title.split("\n").reduce((count, line, i, lines) => {
    const next = count + line.split(/\s+/).filter(Boolean).length;
    if (i < lines.length - 1) breaks.push(next - 1);
    return next;
  }, 0);
  return (
    <Container as="header">
      <div className="flex flex-col gap-2">
        <BackLink
          href={backHref}
          data-story="back"
          className="mono-medium flex w-fit items-center gap-2 text-basement-white transition-colors hover:text-basement-orange"
        >
          <ArrowLeft />
          {backLabel}
        </BackLink>
        <div
          aria-hidden
          data-story="line"
          className="h-0 w-full border-t border-basement-grey"
        />
      </div>

      <div className="mt-3 flex max-w-[1255px] flex-col gap-[101px] md:mt-[60px] md:gap-8 lg:flex-row lg:justify-between">
        <HeroTitle
          breaks={breaks}
          className="h2 max-md:!text-[40px] max-md:!leading-[0.9] max-md:!tracking-[-0.04em] text-basement-white lg:w-[304px] lg:shrink-0"
        >
          {title.replace(/\s+/g, " ").trim()}
        </HeroTitle>

        {/* Tablet: texto a la izquierda con ancho máximo de 581px (~70 caracteres por renglón) */}
        <div
          data-story="text"
          className="flex flex-col gap-2 md:max-w-[581px] md:gap-6 lg:ml-0 lg:max-w-none lg:w-[553px] lg:shrink-0"
        >
          <MaskText>
            <Text variant="h3Regular" tone="white">
              {summary}
            </Text>
          </MaskText>
          <MaskText className="md:hidden">
            <Text variant="bodySm" tone="white">
              {renderIntro(intro)}
            </Text>
          </MaskText>
          <MaskText className="hidden md:block">
            <Text variant="body" tone="white">
              {renderIntro(intro)}
            </Text>
          </MaskText>
        </div>
      </div>
    </Container>
  );
};
