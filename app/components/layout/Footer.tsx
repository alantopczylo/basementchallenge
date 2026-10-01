import { isLiveRoute } from "@/lib/site";
import React from "react";
import Link from "next/link";
import { MaskText } from "@/components/common/MaskText";
import Image from "next/image";
import { noiseBackground } from "@/lib/noise";
import { FooterReveal } from "@/components/layout/FooterReveal";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterProps {
  website?: FooterLink[];
  legal?: FooterLink[];
  connect?: FooterLink[];
  copyright?: string;
  /** Segunda parte del copyright: en mobile baja a una línea nueva */
  rights?: string;
  membership?: string;
  /** Vector de SoDA a la derecha del texto (mobile 10.77 x 12.47, gap 8 | desktop 21 x 24, gap 16) */
  membershipIcon?: React.ReactNode;
  /** Muestra el wordmark gigante "basement." (default: true) */
  wordmark?: boolean;
  /** Muestra la línea de copyright + SoDA debajo del wordmark (default: true) */
  legalBar?: boolean;
}

const DEFAULT_WEBSITE: FooterLink[] = [
  { label: "Home", href: "/blog" },
  { label: "Services", href: "/services" },
  { label: "Showcase", href: "/showcase" },
  { label: "People", href: "/people" },
  { label: "Blog", href: "/blog" },
  { label: "Lab", href: "/laboratory" },
];

const DEFAULT_LEGAL: FooterLink[] = [
  { label: "Terms of Use", href: "/terms-of-use" },
  { label: "Terms and Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Trust Center", href: "/trust-center" },
];

const DEFAULT_CONNECT: FooterLink[] = [
  { label: "X (Twitter)", href: "https://x.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Github", href: "https://github.com" },
];

// Logo "basement." (PNG como máscara) con gradiente + monotone noise (negro 25%)
const logoMask: React.CSSProperties = {
  WebkitMaskImage: "url('/images/basement.png')",
  maskImage: "url('/images/basement.png')",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
};

// Progressive blur: 6 niveles (0 → 10px) entre 22.93% y 115.96% de la altura
const BLUR_START = 22.93;
const BLUR_END = 115.96;
const BLUR_STEPS = 5;
const BLUR_LAYERS = Array.from({ length: BLUR_STEPS + 1 }, (_, i) => {
  const at = (n: number) =>
    BLUR_START + (n * (BLUR_END - BLUR_START)) / BLUR_STEPS;
  const mask =
    i === 0
      ? undefined
      : `linear-gradient(180deg, transparent ${at(i - 1).toFixed(2)}%, #000 ${at(i).toFixed(2)}%)`;
  return {
    blur: (i * 6) / BLUR_STEPS,
    style: mask ? { WebkitMaskImage: mask, maskImage: mask } : undefined,
  };
});

const Wordmark: React.FC<{ blur?: number; style?: React.CSSProperties }> = ({
  blur = 0,
  style,
}) => (
  <div
    className="absolute inset-0"
    style={{
      filter: blur
        ? `blur(calc(${blur}px * var(--wordmark-blur, 1)))`
        : undefined,
    }}
  >
    <div className="absolute inset-0" style={style}>
      <div
        className="absolute inset-0"
        style={{
          ...logoMask,
          background:
            "linear-gradient(180deg, #000000 -2.95%, #434343 129.42%)",
        }}
      ></div>
    </div>
  </div>
);

export const Footer: React.FC<FooterProps> = ({
  website = DEFAULT_WEBSITE,
  legal = DEFAULT_LEGAL,
  connect = DEFAULT_CONNECT,
  copyright = "© basement.studio LLC 2026.",
  rights = "All rights reserved.",
  membership = "Proud Member of SoDA",
  membershipIcon = (
    <Image
      src="/images/Vector.png"
      alt=""
      width={21}
      height={24}
      unoptimized
      className="h-[12px] w-[11px] md:h-6 md:w-[21px]"
    />
  ),
  wordmark = true,
  legalBar = true,
}) => {
  const columns = [
    {
      title: "Website",
      links: website,
      span: "col-span-1 md:col-span-2 lg:col-span-1",
    },
    {
      title: "Legal",
      links: legal,
      span: "col-span-2 md:col-span-2 lg:col-span-1",
    },
    {
      title: "Connect",
      links: connect,
      span: "col-span-1 md:col-span-2 lg:col-span-1",
    },
  ];

  return (
    <footer
      className={`relative overflow-x-clip bg-basement-black pt-[34px] ${legalBar ? "pb-4" : wordmark ? "pb-[43px] md:pb-[56px]" : "pb-10"} text-basement-white`}
    >
      <FooterReveal />
      {/* Filo superior: se traza con la entrada (FooterReveal) */}
      <span
        aria-hidden
        data-f="line"
        className="absolute inset-x-0 top-0 h-px origin-left bg-basement-grey"
      />
      {/* Mismo ancho que la navbar; cada columna de links ocupa 1 de las 6 columnas del grid */}
      {/* z-10: el contenido queda por encima de los puntos del cursor (su fondo negro, por debajo) */}
      <div className="container relative z-10">
        <nav
          aria-label="Footer"
          className="group/footer grid grid-cols-4 gap-x-3 gap-y-10 md:grid-cols-6 md:gap-x-8"
        >
          {columns.map((col, colIndex) => (
            <div
              key={col.title}
              className={`flex min-w-0 flex-col gap-4 ${col.span}`}
            >
              <h2 data-f="title" className="footer-title text-basement-orange">
                <MaskText inline>{col.title}</MaskText>
              </h2>
              <ul className="flex flex-col gap-2">
                {col.links.map((link, row) => {
                  const external = link.href.startsWith("http");
                  return (
                    <li
                      key={link.label}
                      data-f="link"
                      data-f-col={colIndex}
                      data-f-row={row}
                      className="flex"
                    >
                      <Link
                        href={link.href}
                        prefetch={isLiveRoute(link.href) ? undefined : false}
                        {...(external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="footer-link relative w-fit text-basement-white transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-1"
                      >
                        <MaskText inline>{link.label}</MaskText>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* En mobile el wordmark es un poco más ancho que la pantalla (la "t" entra justa; se mide contra el ancho del footer, no de la ventana) y el punto final queda recortado por el overflow del footer */}
        {/* Wordmark: PNG del logo como máscara + gradiente 180deg #000 -2.95% → #434343 129.42%
            Progressive blur (0 en 22.93% → 10px en 115.96%): capas apiladas con blur creciente,
            cada una aparece con una rampa vertical y queda encima de la anterior */}
        {wordmark && (
          <div
            aria-hidden
            data-f="wordmark"
            className="wordmark pointer-events-none relative -ml-4 mt-[66px] aspect-[3653/512] w-[calc(104.3%+32px)] max-w-none select-none md:ml-0 md:mt-[63px] md:w-full"
          >
            {/* Una sola capa de GPU para todo el wordmark: se pinta una vez (blur + ruido son caros) y al scrollear solo se compone */}
            <div className="absolute inset-0 will-change-transform">
              {BLUR_LAYERS.map((layer) => (
                <Wordmark
                  key={layer.blur}
                  blur={layer.blur}
                  style={layer.style}
                />
              ))}
              {/* Monotone noise de Figma (size 0.5, density 100%, #000 25% -> opacity 0.5): una sola capa por encima, sin blur, para que el grano se vea nítido */}
              <div
                className="absolute inset-0"
                style={{
                  ...logoMask,
                  backgroundImage: noiseBackground(0.9),
                  backgroundSize: "200px 200px",
                  opacity: 0.5,
                }}
              />
            </div>
          </div>
        )}

        {/* Legales: 20px debajo del wordmark, 16px de gap; mono 500 uppercase en gris */}
        {legalBar && (
          <div
            data-f="legal"
            className={`${wordmark ? "mt-5" : "mt-[66px] md:mt-[63px]"} flex items-start justify-between gap-2 text-[#8c8c8c] md:gap-4`}
          >
            <p className="footer-legal">
              <MaskText>
                {copyright} <span className="block md:inline">{rights}</span>
              </MaskText>
            </p>
            <div className="flex shrink-0 items-center gap-2 md:gap-4">
              <p className="footer-legal whitespace-nowrap text-right">
                <MaskText>{membership}</MaskText>
              </p>
              <span data-f="icon" className="flex">
                {membershipIcon}
              </span>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};
