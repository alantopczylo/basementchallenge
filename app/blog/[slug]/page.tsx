import { Container, FrameCross } from "@/components/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar, Footer } from "@/components/layout";
import { FluidImage } from "@/components/common/FluidImage";
import { PostBody } from "@/components/blog/PostBody";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { PostMeta } from "@/components/blog/PostMeta";
import { PostHeader } from "@/components/blog/PostHeader";
import { PostStory } from "@/components/blog/PostStory";
import { getPost, getPosts, getSettings } from "@/lib/content";
import { toSummary } from "@/lib/posts";
import { footerProps, navbarProps } from "@/lib/site";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export const generateStaticParams = async () =>
  (await getPosts()).map((post) => ({ slug: post.slug }));

export const generateMetadata = async ({
  params,
}: PostPageProps): Promise<Metadata> => {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const title = post.title.replace(/\n/g, " ");
  return { title: `${title} | basement.`, description: post.summary };
};

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const [post, posts, settings] = await Promise.all([
    getPost(slug),
    getPosts(),
    getSettings(),
  ]);
  if (!post) notFound();
  const title = post.title.replace(/\n/g, " ");
  const image = post.image ?? post.cover;
  const authors = post.authors ?? ["Author X", "Author X"];

  return (
    <div className="relative min-h-screen overflow-hidden bg-basement-black text-basement-white">
      <Navbar {...navbarProps(settings)} activeHref="/blog" />

      {/* Top 181 (Figma) en desktop; en tablet/mobile la navbar (fixed) termina en 63px */}
      <main
        id="main-content"
        tabIndex={-1}
        className="outline-none relative z-10 pb-10 pt-[107px] md:pb-section-lg lg:pt-[181px]"
      >
        <PostStory />
        <PostHeader
          title={post.title}
          summary={post.summary}
          intro={post.intro}
          backLabel={settings.ui.goBack}
        />

        {/* Figma: metadata 144px debajo del texto chico; imagen 24px debajo de la metadata.
            Sin portada se mantiene el marco con una X de lado a lado, así todos los posts comparten el mismo ritmo */}
        <div className="mt-12 md:mt-content">
          <Container>
            <div data-story="meta">
              <PostMeta date={post.date} authors={authors} tags={post.tags} />
            </div>
            {image ? (
              <FluidImage
                src={image}
                alt={title}
                sizes="(min-width: 1436px) 1372px, 100vw"
                position={[0.5, 0.9]}
                className="relative mt-6 h-[126px] w-full border border-basement-grey md:mt-6 md:aspect-[1372/472] md:h-auto"
              />
            ) : (
              <div
                data-story="frame"
                className="relative mt-6 h-[126px] w-full border border-basement-grey md:mt-6 md:aspect-[1372/472] md:h-auto"
              >
                <FrameCross />
              </div>
            )}
          </Container>
        </div>

        {/* Figma: contenido 144px debajo de la imagen */}
        {post.content && (
          <div className="mt-10 md:mt-content">
            <PostBody content={post.content} nav={post.nav} ui={settings.ui} />
          </div>
        )}

        {/* Figma: 190px debajo de la navegación */}
        <div className="relative mt-20 md:mt-section-xl">
          <RelatedPosts
            posts={posts.map(toSummary)}
            ui={settings.ui}
            currentSlug={post.slug}
          />
        </div>
      </main>

      <Footer {...footerProps(settings)} />
    </div>
  );
}
