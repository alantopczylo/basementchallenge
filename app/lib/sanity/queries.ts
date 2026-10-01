/** Consultas GROQ. Cada una devuelve datos "crudos"; `lib/content.ts` los convierte a los tipos de la app. */
const POST_FIELDS = `
  "slug": slug.current,
  title,
  date,
  order,
  "tags": tags[]->title,
  cover{asset, alt},
  image{asset, alt},
  summary,
  intro,
  authors,
  content[]{ _type, title, lead, leadSize, body, bullets, text, author, role },
  "prev": prev{label, "slug": post->slug.current},
  "next": next{label, "slug": post->slug.current}
`;

export const POSTS_QUERY = `*[_type == "post" && defined(slug.current)] | order(coalesce(order, 9999) asc, date desc){ ${POST_FIELDS} }`;

export const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{ ${POST_FIELDS} }`;

export const TAGS_QUERY = `*[_type == "tag" && coalesce(showInFilters, true)] | order(coalesce(order, 9999) asc, title asc).title`;

export const SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  heroTitle,
  "featuredSlug": featuredPost->slug.current,
  featuredExcerpt,
  postsTitle,
  navLinks[]{label, href},
  ctaLabel,
  ctaHref,
  footerWebsite[]{label, href},
  footerLegal[]{label, href},
  footerConnect[]{label, href},
  copyright,
  rights,
  membership,
  seoTitle,
  seoDescription,
  ui
}`;
