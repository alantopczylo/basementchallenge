import { defineArrayMember, defineField } from "sanity";

/** Bloques del contenido de un post. Cada uno se muestra con su propio componente en `PostBody`. */
export const sectionBlock = defineArrayMember({
  type: "object",
  name: "section",
  title: "Section",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title (h2)",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "lead",
      type: "text",
      rows: 4,
      title: "Lead (highlighted text)",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "leadSize",
      type: "string",
      title: "Lead size",
      options: {
        list: [
          { title: "Large (24px)", value: "lg" },
          { title: "Small (16px)", value: "sm" },
        ],
        layout: "radio",
      },
      initialValue: "lg",
    }),
    defineField({
      name: "body",
      type: "text",
      rows: 6,
      title: "Body",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "bullets",
      type: "array",
      title: "Bullets",
      of: [{ type: "string" }],
    }),
  ],
  preview: { select: { title: "title", subtitle: "lead" } },
});

export const quoteBlock = defineArrayMember({
  type: "object",
  name: "quote",
  title: "Quote",
  fields: [
    defineField({
      name: "text",
      type: "text",
      rows: 4,
      title: "Quote",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "author",
      type: "string",
      title: "Author",
      validation: (r) => r.required(),
    }),
    defineField({ name: "role", type: "string", title: "Role" }),
  ],
  preview: { select: { title: "author", subtitle: "text" } },
});

export const paragraphBlock = defineArrayMember({
  type: "object",
  name: "paragraph",
  title: "Paragraph",
  fields: [
    defineField({
      name: "text",
      type: "text",
      rows: 8,
      title: "Text",
      validation: (r) => r.required(),
    }),
  ],
  preview: { select: { title: "text" } },
});
