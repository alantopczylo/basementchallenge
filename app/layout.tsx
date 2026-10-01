import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./styles/globals.css";
import { SmoothScroll } from "@/components/common/SmoothScroll";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { GridOverlay } from "@/components/layout/GridOverlay";
import { Cursor } from "@/components/common/Cursor";
import { CardFluid } from "@/components/common/CardFluid";
import { PageTransition } from "@/components/common/PageTransition";
import { IntroLoader } from "@/components/layout/IntroLoader";
import { getSettings } from "@/lib/content";
import { SITE_URL } from "@/lib/site";
import { SkipLink } from "@/components/layout/SkipLink";
import { DraftBanner } from "@/components/layout/DraftBanner";

export const generateMetadata = async (): Promise<Metadata> => {
  const { seoTitle: title, seoDescription: description } = await getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords: ["blog", "design", "next.js", "react", "typescript"],
    creator: "Basement",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "/",
      title,
      description,
      siteName: "Basement",
    },
    twitter: { card: "summary_large_image", title, description },
  };
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

// Fuentes con next/font: se descargan en el build, se sirven desde el mismo dominio y llevan una fuente de respaldo con
// las medidas ajustadas, así al cargar Geist el texto casi no se corre (antes se veía el salto de anchos de los links).
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-loaded",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono-loaded",
  display: "swap",
});

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const { ui } = await getSettings();
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        {/* Al recargar o entrar, la página arranca arriba (el navegador no restaura la posición vieja); atrás/adelante sí la conserva */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var n=performance.getEntriesByType("navigation")[0];if(!n||n.type!=="back_forward"){history.scrollRestoration="manual";window.scrollTo(0,0)}}catch(e){}',
          }}
        />
        <meta name="theme-color" content="#000000" />
        <noscript>
          <style>
            {"[data-reveal]{opacity:1!important;transform:none!important}"}
          </style>
        </noscript>
      </head>
      <body className="bg-basement-black text-basement-white antialiased">
        {/* Primer elemento al tabular: salta la navbar e ingresa directo al contenido */}
        <SkipLink>{ui.skipToContent}</SkipLink>
        <IntroLoader />
        {children}
        <SmoothScroll />
        <ScrollReveal />
        <GridOverlay />
        <Cursor viewPostLabel={ui.viewPost} />
        <CardFluid />
        <PageTransition />
        <DraftBanner />
      </body>
    </html>
  );
}
