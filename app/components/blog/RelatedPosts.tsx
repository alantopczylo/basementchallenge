"use client";

import React, { useEffect, useRef, useState } from "react";
import { DragScroll, MaskText } from "@/components/common";
import { Button, Chevron, Container, Text } from "@/components/ui";
import { PostCard } from "@/components/blog/PostCard";
import type { PostSummary } from "@/lib/posts";
import type { UiTexts } from "@/lib/settings";

export interface RelatedPostsProps {
  /** Textos de interfaz (editables en Sanity) */
  ui: Pick<UiTexts, "relatedPosts" | "readMore" | "loadMore">;
  /** Todos los posts (de ahí se eligen los relacionados) */
  posts: PostSummary[];
  /** Slug del post actual (se excluye) */
  currentSlug: string;
  limit?: number;
}

export const RelatedPosts = ({
  posts,
  ui,
  currentSlug,
  limit = 6,
}: RelatedPostsProps) => {
  const related = posts
    .filter((post) => post.slug !== currentSlug)
    .sort((a, b) => Number(Boolean(b.cover)) - Number(Boolean(a.cover)))
    .slice(0, limit);

  // Mobile: se ven 3 cards y "Load more" suma 3 (en tablet y desktop están todas en la fila arrastrable)
  const [visible, setVisible] = useState(3);

  // Flechas anterior / siguiente (md+): el arrastre no es la única forma de avanzar. Se apagan en los extremos.
  const sectionRef = useRef<HTMLElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  useEffect(() => {
    const list = sectionRef.current?.querySelector("ul");
    if (!list) return;
    const update = () =>
      setEdge({
        start: list.scrollLeft <= 2,
        end: list.scrollLeft >= list.scrollWidth - list.clientWidth - 2,
      });
    update();
    list.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      list.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  const step = (dir: 1 | -1) => {
    const list = sectionRef.current?.querySelector("ul");
    const items = list?.children;
    if (!list || !items || items.length < 2) return;
    const w =
      (items[1] as HTMLElement).offsetLeft -
      (items[0] as HTMLElement).offsetLeft;
    list.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  return (
    <>
      <Container as="section" grid ref={sectionRef}>
        <div
          data-reveal="card"
          data-blur
          className="lg:col-span-1 lg:self-start"
        >
          <MaskText pad="6px">
            <Text
              variant="h2"
              className="mb-3 md:mb-6 max-md:!text-[40px] max-md:!leading-[0.9] max-md:!tracking-[-0.04em] lg:mb-6"
            >
              {ui.relatedPosts.split(" ").map((word, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <br />}
                  {word}
                </React.Fragment>
              ))}
            </Text>
          </MaskText>
          <div className="mb-6 hidden gap-2 md:flex lg:mb-0">
            {([-1, 1] as const).map((dir) => {
              const disabled = dir === -1 ? edge.start : edge.end;
              return (
                <button
                  key={dir}
                  type="button"
                  disabled={disabled}
                  onClick={() => step(dir)}
                  aria-label={dir === -1 ? "Previous posts" : "Next posts"}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-basement-grey text-basement-white transition-[opacity,border-color] duration-300 hover:border-basement-orange disabled:pointer-events-none disabled:opacity-30"
                >
                  <Chevron direction={dir === -1 ? "prev" : "next"} />
                </button>
              );
            })}
          </div>
        </div>

        <DragScroll
          aria-label="Related posts (use the arrow keys to move)"
          className="scrollbar-none flex flex-col gap-3 md:-mr-8 md:flex-row md:gap-8 md:overflow-x-auto md:pr-8 lg:col-span-5 lg:-mr-[max(32px,calc((100vw-1372px)/2))] lg:pr-[max(32px,calc((100vw-1372px)/2))]"
        >
          {related.map((post, i) => (
            <li
              key={post.slug}
              className={`w-full shrink-0 snap-start snap-always md:flex md:w-[436px] ${i >= visible ? "hidden" : "flex"}`}
            >
              <PostCard
                href={`/blog/${post.slug}`}
                date={post.date}
                title={post.title}
                tags={post.tags}
                image={post.cover}
                theme="dark"
                readMoreLabel={ui.readMore}
                className="w-full"
              />
            </li>
          ))}
        </DragScroll>

        {visible < related.length && (
          <div
            data-reveal="soft"
            className="mt-10 flex justify-center md:hidden"
          >
            <Button variant="dark" onClick={() => setVisible((v) => v + 3)}>
              {ui.loadMore}
            </Button>
          </div>
        )}
      </Container>
      {/* Degradado a la derecha: la última card se pierde un poco; al llegar al final se va */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 hidden w-40 transition-opacity duration-500 md:block lg:w-[436px] ${edge.end ? "opacity-0" : "opacity-100"}`}
        style={{
          background:
            "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, #000000 100%)",
        }}
      />
    </>
  );
};
