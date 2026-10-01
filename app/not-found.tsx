import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { Navbar, Footer } from "@/components/layout";
import { HeroTitle } from "@/components/common/HeroTitle";
import { HeroEllipse } from "@/components/common/HeroEllipse";
import { getSettings } from "@/lib/content";
import { footerProps, navbarProps } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

// 404: el mismo sol del hero detrás, un título grande y un camino de vuelta
export default async function NotFound() {
  const settings = await getSettings();

  return (
    <div className="relative min-h-screen overflow-hidden bg-basement-black text-basement-white">
      <HeroEllipse />
      <div className="page-world relative flex min-h-screen flex-col">
        <Navbar {...navbarProps(settings)} />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex flex-1 flex-col outline-none"
        >
          <section className="relative z-10 flex flex-1 items-end pb-section-sm pt-section-lg md:pb-section-lg">
            <Container>
              <p
                data-reveal="soft"
                className="mono-medium mb-6 text-basement-orange"
              >
                Error 404
              </p>
              <HeroTitle
                className="max-w-[1059px] text-basement-white"
                breaks={[1]}
              >
                This page got lost in the basement
              </HeroTitle>
              <div data-reveal="soft" className="mt-10 md:mt-14">
                <Link href="/blog" className="btn btn-dark">
                  Back to the blog
                </Link>
              </div>
            </Container>
          </section>
        </main>

        <div className="relative z-10">
          <Footer {...footerProps(settings)} legalBar={false} />
        </div>
      </div>
    </div>
  );
}
