import { defineArrayMember, defineField, defineType } from "sanity";

const link = defineArrayMember({
  type: "object",
  name: "link",
  fields: [
    defineField({
      name: "label",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "href",
      type: "string",
      description: "Ruta interna (/services) o URL completa (https://…)",
      validation: (r) => r.required(),
    }),
  ],
  preview: { select: { title: "label", subtitle: "href" } },
});

/** Un único documento con los textos y links globales del sitio. */
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  groups: [
    { name: "home", title: "Home", default: true },
    { name: "nav", title: "Navigation" },
    { name: "footer", title: "Footer" },
    { name: "ui", title: "Interface texts" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "heroTitle",
      type: "text",
      rows: 3,
      group: "home",
      title: "Hero title",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "featuredPost",
      type: "reference",
      to: [{ type: "post" }],
      group: "home",
      description: "Card grande del hero",
    }),
    defineField({
      name: "featuredExcerpt",
      type: "text",
      rows: 3,
      group: "home",
      description: "Texto corto de la card del hero",
    }),
    defineField({
      name: "postsTitle",
      type: "string",
      group: "home",
      title: "Posts section title",
    }),
    defineField({
      name: "navLinks",
      type: "array",
      group: "nav",
      of: [link],
    }),
    defineField({ name: "ctaLabel", type: "string", group: "nav" }),
    defineField({ name: "ctaHref", type: "string", group: "nav" }),
    defineField({
      name: "footerWebsite",
      type: "array",
      group: "footer",
      title: "Footer: website links",
      of: [link],
    }),
    defineField({
      name: "footerLegal",
      type: "array",
      group: "footer",
      title: "Footer: legal links",
      of: [link],
    }),
    defineField({
      name: "footerConnect",
      type: "array",
      group: "footer",
      title: "Footer: social links",
      of: [link],
    }),
    defineField({ name: "copyright", type: "string", group: "footer" }),
    defineField({ name: "rights", type: "string", group: "footer" }),
    defineField({ name: "membership", type: "string", group: "footer" }),
    defineField({
      name: "ui",
      type: "object",
      group: "ui",
      title: "Interface texts",
      description:
        "Textos fijos de botones y etiquetas. Si un campo queda vacío se usa el texto por defecto.",
      options: { collapsible: false },
      fields: [
        defineField({
          name: "skipToContent",
          type: "string",
          title: "Skip link",
        }),
        defineField({
          name: "allPosts",
          type: "string",
          title: "Filter: all posts",
        }),
        defineField({ name: "readMore", type: "string", title: "Card button" }),
        defineField({
          name: "readFullPost",
          type: "string",
          title: "Featured card button",
        }),
        defineField({
          name: "loadMore",
          type: "string",
          title: "Load more button",
        }),
        defineField({
          name: "relatedPosts",
          type: "string",
          title: "Related posts title",
        }),
        defineField({
          name: "viewPost",
          type: "string",
          title: "Cursor label over cards",
        }),
        defineField({ name: "goBack", type: "string", title: "Back link" }),
        defineField({
          name: "previous",
          type: "string",
          title: "Previous badge",
        }),
        defineField({ name: "next", type: "string", title: "Next badge" }),
      ],
    }),
    defineField({
      name: "seoTitle",
      type: "string",
      group: "seo",
      title: "Site title",
    }),
    defineField({
      name: "seoDescription",
      type: "text",
      rows: 3,
      group: "seo",
      title: "Site description",
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
