# basement. — blog

A blog built from a Figma design: a home with a featured post and a filterable list, and a detail page per post. All
content is served from Sanity and the whole site is animated with GSAP.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 3 · GSAP (+ ScrollTrigger, SplitText,
CustomEase) · Lenis · Sanity v3 · Vercel.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the Sanity project id
npm run dev                  # http://localhost:3000
```

The site works **without** Sanity: if `NEXT_PUBLIC_SANITY_PROJECT_ID` is not set (or a query fails) it falls back to the
local content in `app/lib/posts.ts` and `app/lib/settings.ts`.

### Sanity

```bash
npx sanity login
npm run sanity:seed     # uploads the current content (posts, tags, settings, images) to the dataset
npm run sanity:start    # Studio on http://localhost:3333
npm run sanity:deploy   # optional: host the Studio on <name>.sanity.studio
```

Add the site and Studio origins (`http://localhost:3000`, `http://localhost:3333`, the Vercel domain) to the project's
CORS origins in sanity.io/manage.

### Draft preview (optional)

1. In sanity.io/manage → API → Tokens, create a token with the **Viewer** role.
2. Site env vars: `SANITY_API_READ_TOKEN` (the token) and `SANITY_PREVIEW_SECRET` (any long random string).
3. Studio env vars: `SANITY_STUDIO_PREVIEW_SECRET` (same string) and `SANITY_STUDIO_SITE_URL` (defaults to `http://localhost:3000`).
4. In the Studio, open a post or Site settings and use **Open preview** (document actions menu). A banner shows while preview
   is on; "Exit preview" turns it off. Without the token the preview shows published content only.

### Deploying to Vercel

1. Import the repo in Vercel (framework preset: Next.js, no extra settings).
2. Environment variables: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_REVALIDATE_SECRET`
   (and the preview variables above if you want draft preview).
3. (Optional, for instant updates) In Sanity, create a webhook that POSTs to
   `https://<your-site>/api/revalidate?secret=<SANITY_REVALIDATE_SECRET>`. Without it, content refreshes every 60 s.

## Implemented features

**Content (Sanity)**

- Posts: title, slug, date, tags, card cover, header image, summary, intro, authors, and a block-based body
  (section with bullets, quote, paragraph), plus previous / next links.
- Tags (they drive the filters on the home, in the order set in the Studio) and a single "Site settings" document:
  hero title, featured post and excerpt, section title, navbar and footer links, CTA, copyright, SEO title and description.
- Images are served from Sanity's CDN, resized and in an optimized format (`auto=format`).
- Interface texts (buttons, labels, skip link, cursor label…) are editable in Site settings → Interface texts; an empty field uses the default.
- `robots.txt` and `sitemap.xml` are generated (the sitemap lists the posts that exist in Sanity); the site URL comes from Vercel's production domain, or `NEXT_PUBLIC_SITE_URL` if you set it.
- Content is cached and revalidated every 60 s, or instantly through the `/api/revalidate` webhook.
- Draft preview: "Open preview" in the Studio opens the site in Next.js draft mode and shows unpublished changes (see below).

**Pages and navigation**

- Home (`/blog`; `/` redirects there): hero, featured post, filterable post list with "Load more". The active filter is kept in the URL (`/blog?tag=web-design`), so filtered views can be shared.
- Post page: header, metadata, large image, body, previous / next, and a draggable "Related posts" row with arrow buttons.
- Responsive layouts for mobile, tablet and desktop, with a mobile menu.
- A custom 404 page with the hero sun and a way back to the blog.
- Layout grid overlay: press **Ctrl + G** to toggle the 4 / 6-column grid used for the layout (a short notice confirms it, and a console message mentions it).
- `/design-system`: a live page with the type scale, colors and components.

**Interactions and details**

- Intro sequence and a pixel-mosaic page transition (with prefetch on hover / focus).
- Per-word text reveals and a GSAP master timeline that tells the story of the post page.
- Hero "sun" with an elastic edge that reacts to the mouse (WebGL); on touch devices it moves on its own.
- Post cards turn from grayscale to color with a liquid ink that follows the cursor (WebGL).
- Post image reveals with a liquid, shader-driven transition.
- Custom cursor (registration mark, frame around links, "View post" label, drag cursor) and a halftone flashlight.
- Smooth scrolling (Lenis), hover effects only on devices that have hover, flipping link labels, footer reveal.

**Accessibility**

- Fully keyboard navigable: "Skip to content" link, visible focus ring everywhere, carousel on arrow keys, filter buttons
  with `aria-pressed` and a live region that announces the result count, menu closes with Esc and returns focus.
- Landmarks (`nav`, `main`, `footer`), one `h1` per page and a logical heading order, `lang`, alt texts.
- `prefers-reduced-motion` turns off every animation and all WebGL effects. Zero `axe-core` violations (WCAG 2 A / AA +
  best practices) on the home and on a post page.

## Technical decisions

- **Data layer in one place** (`app/lib/content.ts`): the only code that knows where data comes from. Pages are Server
  Components that fetch and pass props down; client components only receive what they render (the home does not ship the
  full body of every post).
- **Sanity with a local fallback**: the site never renders empty and can be developed without credentials. The seed script
  uses the same local data, so there is a single source of truth for the initial content.
- **Design system**: a type kit (`app/lib/typography.ts` → CSS classes + a polymorphic `<Text>`), tokens in
  `tailwind.config.ts`, and `app/components/ui` (Button, Badge, Tag, Container, Section, Icons…). Blog components compose
  those; nothing styles typography ad hoc.
- **GSAP for everything that moves**: timelines with labels and position parameters, `quickTo` for pointer following,
  `matchMedia` for reduced motion, ScrollTrigger for reveals. Animations are driven by `data-*` attributes (`data-reveal`,
  `data-story`, `data-blur`…) so components stay declarative.
- **Raw WebGL (no three.js)** for the three shader effects: each is a single full-screen quad, so a library would only add
  weight. They run at reduced resolution, cap the pixel ratio, the card effect only exists while a card is hovered, and the hero effect is capped on phones and switches itself off if the frame rate is too low.
- **Content-driven filters**: the list of filters comes from Sanity tags instead of being hard-coded.
- **Studio kept separate** from the Next app (`sanity.config.ts` at the root, run with `sanity dev`) so it does not share
  the site's layout, smooth scroll or page transitions.

## Trade-offs

- **Visual effects vs. Lighthouse performance.** The WebGL and animation code costs main-thread time. It is mounted only when needed,
  reduced on touch devices and disabled with reduced motion, but it will not score as high as a static page.
- **Footer legal text** uses `#8c8c8c` instead of the design's `#666666` to reach the 4.5:1 contrast ratio on black.
- **Studio not embedded at `/studio`**: embedding it would have required splitting the root layout into route groups.
  It can be hosted on `sanity.studio` with one command.
- **60 s cache by default**: simple and cheap; the webhook makes publishing instant, and draft mode bypasses the cache.
- **Preview secret in the Studio**: the Studio puts `SANITY_STUDIO_PREVIEW_SECRET` in its client bundle, so it is visible to anyone who
  can open the Studio. It only allows viewing drafts (and the server still needs the read token), so it was kept simple.
- **Filter in the URL is applied after mount**, not during server rendering, so the home stays static and cacheable.

## Caveats

- Only the home and the post pages are designed. Other navbar / footer links (`/services`, `/people`…) point to routes
  that do not exist yet and return 404.
- "Load more" is client-side state and is not reflected in the URL (only the active filter is).
- Internal accessibility labels (e.g. `aria-label`s on the carousel arrows) are in English and live in the code.
- `npm run sanity:seed` overwrites the documents it creates: do not run it again after editing content in the Studio.
- The WebGL effects were tested in headless Chromium with software rendering; they should be checked on real GPUs and phones.
- Lighthouse scores have to be measured on the deployed build; local `dev` numbers are not representative.
- Fonts (Geist, Geist Mono) are fetched from Google Fonts at build time through `next/font`, so the build needs internet access.

## Project structure

```
app/
  page.tsx                      redirects "/" to "/blog"
  not-found.tsx                 404 page
  blog/page.tsx                 home: hero, featured post, filterable list
  layout.tsx                    root layout (skip link, global effects)
  blog/[slug]/page.tsx          post page
  design-system/                live style guide
  api/revalidate/               Sanity webhook
  components/{ui,common,blog,layout}
  lib/                          content layer, typography, motion constants, Sanity client / queries
sanity/                         schema types and seed script
sanity.config.ts                Studio configuration
```
