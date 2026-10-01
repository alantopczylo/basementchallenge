"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { Button, Container } from "@/components/ui";
import { HeroTitle } from "@/components/common/HeroTitle";
import { PostCard, PostCardProps } from "@/components/blog/PostCard";
import type { PostSummary } from "@/lib/posts";
import type { UiTexts } from "@/lib/settings";

const PAGE_SIZE = 3; // cards visibles al inicio
const STEP = 3; // cards que suma cada "Load more"
/** El filtro vive en la URL como ?tag=web-design (links compartibles) */
const TAG_PARAM = "tag";
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export interface PostsSectionProps {
  /** Título de la sección */
  title: string;
  /** Filtros por tag (en Sanity: documentos "Tag"); "All posts" se agrega solo */
  tags: string[];
  /** Posts del listado (sin el destacado, que va en el hero); cada card linkea a /blog/[slug] */
  posts: PostSummary[];
  /** Textos de interfaz (editables en Sanity) */
  ui: Pick<UiTexts, "allPosts" | "readMore" | "loadMore">;
}

export const PostsSection: React.FC<PostsSectionProps> = ({
  title,
  tags,
  posts: source,
  ui,
}) => {
  const ALL = ui.allPosts;
  const FILTERS = [ALL, ...tags];
  const POSTS: PostCardProps[] = source.map((p) => ({
    href: `/blog/${p.slug}`,
    date: p.date,
    title: p.title,
    tags: p.tags,
    image: p.cover,
  }));
  const [active, setActive] = useState<string>(ALL);
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Al cargar con ?tag=… se aplica ese filtro. Se hace después de montar (no al renderizar en el servidor), así la home
  // sigue siendo estática y cacheable.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get(TAG_PARAM);
    const match = wanted && tags.find((t) => slugify(t) === slugify(wanted));
    if (match) setActive(match);
  }, [tags]);

  // Cambia el filtro y refleja el valor en la URL sin navegar ni agregar entradas al historial
  const select = (filter: string) => {
    setActive(filter);
    setVisible(PAGE_SIZE);
    const url = new URL(window.location.href);
    if (filter === ALL) url.searchParams.delete(TAG_PARAM);
    else url.searchParams.set(TAG_PARAM, slugify(filter));
    window.history.replaceState(window.history.state, "", url);
  };
  const filtered =
    active === ALL ? POSTS : POSTS.filter((p) => p.tags.includes(active));
  const posts = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  return (
    <section
      data-cursor-light
      className="relative z-10 bg-basement-white pb-10 pt-[13px] md:pb-20 text-basement-black md:pt-14"
    >
      <Container>
        <HeroTitle
          as="h2"
          trigger="scroll"
          mobileBreaks={[0, 2]}
          className="h1 max-w-[720px] text-basement-black"
        >
          {title}
        </HeroTitle>

        <div
          role="group"
          aria-label="Filter posts"
          className="scrollbar-none -mr-3 mt-[155px] flex gap-6 overflow-x-auto pr-3 md:mr-0 md:mt-section-md lg:mt-[191px] md:flex-wrap md:gap-10 md:overflow-visible md:pr-0"
        >
          {FILTERS.map((filter, i) => (
            <button
              key={filter}
              data-reveal="soft"
              data-reveal-step={i}
              aria-pressed={active === filter}
              onClick={() => select(filter)}
              className={clsx(
                "mono-medium shrink-0 whitespace-nowrap transition-colors duration-300",
                active === filter
                  ? "text-basement-black"
                  : "text-basement-grey hover:text-basement-black",
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Aviso para lectores de pantalla al filtrar o cargar más */}
        <p aria-live="polite" className="sr-only">
          {`Showing ${posts.length} of ${filtered.length} posts`}
        </p>

        <div className="mt-[11px] grid md:mt-[55px] grid-cols-1 gap-3 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.href} {...post} readMoreLabel={ui.readMore} />
          ))}
        </div>

        {hasMore && (
          <div
            data-reveal="soft"
            className="mt-10 flex justify-center md:mt-[95px]"
          >
            <Button variant="dark" onClick={() => setVisible((v) => v + STEP)}>
              {ui.loadMore}
            </Button>
          </div>
        )}
      </Container>
    </section>
  );
};
