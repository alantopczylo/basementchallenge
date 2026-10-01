import fs from "node:fs";
import path from "node:path";
import { getCliClient } from "sanity/cli";
import { POSTS } from "../app/lib/posts";
import { DEFAULT_SETTINGS, DEFAULT_TAGS } from "../app/lib/settings";

const client = getCliClient({ apiVersion: "2025-01-01" });
const PUBLIC = path.join(process.cwd(), "public");

const uploaded = new Map<string, string>();
const uploadImage = async (publicPath: string, alt: string) => {
  const rel = decodeURIComponent(publicPath).replace(/^\//, "");
  let id = uploaded.get(rel);
  if (!id) {
    const file = path.join(PUBLIC, rel);
    const asset = await client.assets.upload(
      "image",
      fs.createReadStream(file),
      { filename: path.basename(file) },
    );
    id = asset._id;
    uploaded.set(rel, id);
    console.log("  imagen subida:", rel);
  }
  return { _type: "image", asset: { _type: "reference", _ref: id }, alt };
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const toISO = (display: string) =>
  new Date(`${display} UTC`).toISOString().slice(0, 10);
const key = () => Math.random().toString(36).slice(2, 10);
const ref = (id: string) => ({ _type: "reference", _ref: id });

const run = async () => {
  console.log("Tags…");
  const tagTitles = [
    ...new Set([...DEFAULT_TAGS, ...POSTS.flatMap((p) => p.tags)]),
  ];
  for (const [i, title] of tagTitles.entries()) {
    await client.createOrReplace({
      _id: `tag-${slugify(title)}`,
      _type: "tag",
      title,
      order: i,
      showInFilters: true,
    });
  }
  const tagId = (t: string) => `tag-${slugify(t)}`;

  console.log("Posts…");
  for (const [i, p] of POSTS.entries()) {
    const alt = p.title.replace(/\n/g, " ");
    await client.createOrReplace({
      _id: `post-${p.slug}`,
      _type: "post",
      title: p.title,
      slug: { _type: "slug", current: p.slug },
      date: toISO(p.date),
      order: i,
      tags: p.tags.map((t) => ({ ...ref(tagId(t)), _key: key() })),
      cover: p.cover ? await uploadImage(p.cover, alt) : undefined,
      image: p.image ? await uploadImage(p.image, alt) : undefined,
      summary: p.summary,
      intro: p.intro,
      authors: p.authors,
      content: p.content?.map((b) => ({
        _key: key(),
        _type: b.type,
        ...omitType(b),
      })),
    });
  }

  // Navegación anterior / siguiente: segunda pasada, cuando ya existen todos los posts
  for (const p of POSTS) {
    const patch: Record<string, unknown> = {};
    for (const side of ["prev", "next"] as const) {
      const n = p.nav?.[side];
      if (n)
        patch[side] = {
          _type: "object",
          post: ref(`post-${n.slug}`),
          label: n.label,
        };
    }
    if (Object.keys(patch).length)
      await client.patch(`post-${p.slug}`).set(patch).commit();
  }

  console.log("Site settings…");
  const { featuredSlug, ...rest } = DEFAULT_SETTINGS;
  const links = (l: { label: string; href: string }[]) =>
    l.map((x) => ({ _key: key(), _type: "link", ...x }));
  await client.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    heroTitle: rest.heroTitle,
    featuredPost: ref(`post-${featuredSlug}`),
    featuredExcerpt: rest.featuredExcerpt,
    postsTitle: rest.postsTitle,
    navLinks: links(rest.navLinks),
    ctaLabel: rest.ctaLabel,
    ctaHref: rest.ctaHref,
    footerWebsite: links(rest.footerWebsite),
    footerLegal: links(rest.footerLegal),
    footerConnect: links(rest.footerConnect),
    copyright: rest.copyright,
    rights: rest.rights,
    membership: rest.membership,
    ui: rest.ui,
    seoTitle: rest.seoTitle,
    seoDescription: rest.seoDescription,
  });
  console.log(
    "Listo. Abrí el estudio (npm run sanity:start) para ver el contenido.",
  );
};

const omitType = <T extends { type: string }>(b: T) => {
  const { type: _type, ...rest } = b;
  void _type;
  return rest;
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
