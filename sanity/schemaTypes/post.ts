import { defineArrayMember, defineField, defineType } from "sanity";
import { paragraphBlock, quoteBlock, sectionBlock } from "./blocks";

export const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  groups: [
    { name: "main", title: "Main", default: true },
    { name: "content", title: "Content" },
    { name: "nav", title: "Navigation" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "text",
      rows: 2,
      group: "main",
      description:
        "Una línea nueva fuerza un salto de línea en el título (como en el diseño).",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "main",
      options: {
        source: (doc) => String(doc.title ?? "").replace(/\n/g, " "),
        maxLength: 96,
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "date",
      type: "date",
      group: "main",
      options: { dateFormat: "MMM D, YYYY" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tags",
      type: "array",
      group: "main",
      of: [defineArrayMember({ type: "reference", to: [{ type: "tag" }] })],
      validation: (r) => r.unique(),
    }),
    defineField({
      name: "order",
      type: "number",
      group: "main",
      title: "Position in the list",
      description:
        "Opcional. Menor = primero. Sin valor, los posts se ordenan por fecha (el más nuevo primero).",
    }),
    defineField({
      name: "cover",
      type: "image",
      group: "main",
      title: "Card cover",
      description:
        "Portada de la card del listado. Sin portada la card queda más baja.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt text",
          description: "Describe la imagen para lectores de pantalla",
        }),
      ],
    }),
    defineField({
      name: "image",
      type: "image",
      group: "main",
      title: "Header image",
      description:
        "Imagen grande del detalle. Si se deja vacía se usa la portada.",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", type: "string", title: "Alt text" })],
    }),
    defineField({
      name: "summary",
      type: "text",
      rows: 3,
      group: "main",
      title: "Summary (big text)",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "intro",
      type: "text",
      rows: 6,
      group: "main",
      title: "Intro (small text)",
      description:
        "Marcas: {{texto|/ruta}} lo subraya y lo linkea, {{texto}} solo subraya, :saluting_face: inserta el emoji 🫡.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "authors",
      type: "array",
      group: "main",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "content",
      type: "array",
      group: "content",
      of: [sectionBlock, quoteBlock, paragraphBlock],
    }),
    defineField({
      name: "prev",
      type: "object",
      group: "nav",
      title: "Previous post",
      fields: [
        defineField({
          name: "post",
          type: "reference",
          to: [{ type: "post" }],
        }),
        defineField({
          name: "label",
          type: "string",
          description: "Texto corto junto al botón",
        }),
      ],
    }),
    defineField({
      name: "next",
      type: "object",
      group: "nav",
      title: "Next post",
      fields: [
        defineField({
          name: "post",
          type: "reference",
          to: [{ type: "post" }],
        }),
        defineField({
          name: "label",
          type: "string",
          description: "Texto corto junto al botón",
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "date", media: "cover" },
    prepare: ({ title, subtitle, media }) => ({
      title: String(title ?? "").replace(/\n/g, " "),
      subtitle,
      media,
    }),
  },
  orderings: [
    {
      title: "Date, newest first",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
});
