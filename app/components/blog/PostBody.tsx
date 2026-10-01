import React from "react";
import Link from "next/link";
import clsx from "clsx";
import { MaskText } from "@/components/common";
import { Badge, Text, Container } from "@/components/ui";
import type { Post, PostBlock } from "@/lib/posts";
import type { UiTexts } from "@/lib/settings";

export interface PostBodyProps {
  content: PostBlock[];
  nav?: Post["nav"];
  /** Textos de interfaz (editables en Sanity) */
  ui: Pick<UiTexts, "previous" | "next">;
}

const Block = ({ block }: { block: PostBlock }) => {
  if (block.type === "quote") {
    return (
      <figure className="flex flex-col gap-4 md:gap-6">
        <MaskText>
          <Text as="blockquote" variant="h2">
            {block.text}
          </Text>
        </MaskText>
        
        <MaskText>
          <figcaption className="body-semibold flex items-center gap-2">
            <span className="text-basement-white">{block.author}</span>
            <span className="text-basement-grey">{block.role}</span>
          </figcaption>
        </MaskText>
      </figure>
    );
  }

  if (block.type === "paragraph") {
    return (
      <MaskText>
        <Text variant="body">{block.text}</Text>
      </MaskText>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <MaskText pad="6px">
        <h2>{block.title}</h2>
      </MaskText>
      <div className="flex flex-col gap-4 md:gap-6">
        <MaskText>
          <p className={block.leadSize === "sm" ? "body-semibold" : "h3"}>
            {block.lead}
          </p>
        </MaskText>
        <MaskText>
          <Text variant="body">{block.body}</Text>
        </MaskText>
        {block.bullets && (
          <MaskText>
            <ul className="body-regular list-disc pl-6">
              {block.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </MaskText>
        )}
      </div>
    </section>
  );
};

// Figma: secondary button (Badge grey) + título Geist Mono 500 14px, gap 16
const NavLink = ({
  slug,
  label,
  direction,
  text,
}: {
  slug: string;
  label: string;
  direction: "prev" | "next";
  /** "Previous" / "Next" (editable en Sanity) */
  text: string;
}) => (
  <Link
    href={`/blog/${slug}`}
    className={clsx(
      "mono-medium group flex items-center gap-4 text-basement-white transition-colors duration-300 hover:text-basement-orange",
      direction === "next" && "flex-row-reverse",
    )}
  >
    <Badge
      variant="grey"
      className="group-hover:bg-basement-orange group-hover:text-basement-black"
    >
      {text}
    </Badge>
    <span className="hidden md:inline">{label}</span>
  </Link>
);

export const PostBody = ({ content, nav, ui }: PostBodyProps) => (
  <Container grid className="post-body">
    <div className="flex w-full flex-col gap-12 md:max-w-[581px] lg:col-span-4 lg:col-start-2 lg:max-w-none lg:gap-20">
      {content.map((block, i) => (
        <div key={i} data-reveal="card" className="lg:max-w-[880px]">
          <Block block={block} />
        </div>
      ))}
      {nav && (
        <nav
          aria-label="Post navigation"
          data-reveal="fade"
          className="flex items-center justify-between"
        >
          {nav.prev ? (
            <NavLink {...nav.prev} direction="prev" text={ui.previous} />
          ) : (
            <span />
          )}
          {nav.next && (
            <NavLink {...nav.next} direction="next" text={ui.next} />
          )}
        </nav>
      )}
    </div>
  </Container>
);
