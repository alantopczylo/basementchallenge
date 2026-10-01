import { Container } from "@/components/ui";
import { Navbar, Footer } from "@/components/layout";
import { HeroTitle } from "@/components/common/HeroTitle";
import { HeroEllipse } from "@/components/common/HeroEllipse";
import { FeaturedPostCard } from "@/components/blog/FeaturedPostCard";
import { PostsSection } from "@/components/blog/PostsSection";
import { getFeaturedPost, getPosts, getSettings, getTags } from "@/lib/content";
import { toSummary } from "@/lib/posts";
import { footerProps, navbarProps } from "@/lib/site";

export default async function BlogPage() {
  const [posts, settings, tags, featured] = await Promise.all([
    getPosts(),
    getSettings(),
    getTags(),
    getFeaturedPost(),
  ]);
  const listed = posts.filter((p) => p.slug !== featured?.slug).map(toSummary);

  return (
    <div className="relative min-h-screen overflow-hidden bg-basement-black text-basement-white">
      {/* El sol queda fijo detrás; page-world es lo que "sube" con la cámara (ver IntroLoader) */}
      <HeroEllipse />
      <div className="page-world relative min-h-screen">
        {/* Navigation */}
        <Navbar {...navbarProps(settings)} />

        <main id="main-content" tabIndex={-1} className="outline-none">
          {/* Hero Section */}
          {/* pt-[73px] = fin de la navbar (top 23 + alto 50); el h1 agrega el margin-top de Figma (170.64 - 73) */}
          {/* Mobile: el hero mide al menos una pantalla (svh = con la barra del navegador visible), así no se asoma lo blanco de abajo; el título queda arriba y la card abajo */}
          <section className="relative z-10 pb-section-sm pt-[74px] max-md:flex max-md:min-h-[100svh] max-md:flex-col md:pb-section-lg md:pt-[73px] lg:pb-[286px]">
            <Container className="max-md:flex max-md:flex-1 max-md:flex-col">
              <HeroTitle className="max-md:mb-auto md:mt-[64px] lg:mt-[98px] max-w-[1059px] text-basement-white">
                {settings.heroTitle}
              </HeroTitle>

              {/* pb-[286px]: margen entre la card y la sección blanca */}
              {/* top 670.63 (Figma) - fin del h1 (~375.8) = 296px de margin-top */}
              {featured && (
                <FeaturedPostCard
                  className="mt-section-sm md:mt-section-lg lg:mt-[296px]"
                  href={`/blog/${featured.slug}`}
                  image={featured.image ?? featured.cover}
                  imageAlt={featured.title.replace(/\n/g, " ")}
                  date={featured.date}
                  title={featured.title}
                  tags={featured.tags}
                  excerpt={settings.featuredExcerpt}
                  ctaLabel={settings.ui.readFullPost}
                />
              )}
            </Container>
          </section>

          {/* Posts (sección blanca) */}
          <PostsSection
            title={settings.postsTitle}
            tags={tags}
            ui={settings.ui}
            posts={listed}
          />
        </main>

        {/* Footer */}
        <div className="relative z-10">
          <Footer {...footerProps(settings)} legalBar={false} />
        </div>
      </div>
    </div>
  );
}
