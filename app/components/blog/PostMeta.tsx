import React from "react";
import { TagList } from "@/components/ui";

export interface PostMetaProps {
  date: string;
  authors: string[];
  tags: string[];
}

// Figma: 668.75x13, Geist 600 13px lh 100%, blanco; cuadrado 4x4 #666 entre fecha y autores; tags a la derecha
export const PostMeta = ({ date, authors, tags }: PostMetaProps) => (
  <div className="meta flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-basement-white lg:ml-auto lg:w-[669px]">
    <div className="flex items-center gap-2">
      <time>{date}</time>
      <span aria-hidden className="h-1 w-1 bg-basement-grey" />
      <span>{authors.join(", ")}</span>
    </div>
    <TagList tags={tags} variant="dark" className="hidden gap-2 md:flex" />
  </div>
);
