import { defineField, defineType } from "sanity";

/** Categorías del blog: los filtros de la home salen de acá (en el orden en que se cargan). */
export const tag = defineType({
  name: "tag",
  title: "Tag",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "order",
      type: "number",
      title: "Position in filters",
      description: "Menor = más a la izquierda",
    }),
    defineField({
      name: "showInFilters",
      type: "boolean",
      title: "Show in the home filters",
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: "Position",
      name: "order",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});
