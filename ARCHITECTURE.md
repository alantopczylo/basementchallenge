# Architecture

```
app/
  page.tsx                      redirects "/" to "/blog"
  blog/page.tsx                 home (Server Component: fetches content, renders sections)
  blog/[slug]/page.tsx          post page (static params from Sanity, revalidated)
  design-system/page.tsx        live style guide
  api/revalidate/route.ts       Sanity webhook -> revalidateTag
  layout.tsx                    root layout: fonts, skip link, global effects (cursor, transition, smooth scroll)
  components/
    ui/                         design-system primitives: Text, Container, Section, Button, Badge, Tag, Icons, FrameCross
    common/                     behavior and effects: HeroTitle, MaskText, ScrollReveal, SmoothScroll, PageTransition,
                                Cursor, DragScroll, FluidImage, CardFluid, HeroEllipse / SunLife (WebGL), FlipLabel
    blog/                       PostCard, FeaturedPostCard, PostsSection, PostHeader, PostBody, PostMeta, PostStory, RelatedPosts
    layout/                     Navbar, Footer, IntroLoader, GridOverlay, StairLogo
  lib/
    content.ts                  the only data entry point (Sanity, falling back to local data)
    sanity/                     client, image URL builder, GROQ queries
    posts.ts, settings.ts       local content: fallback and seed source
    typography.ts               type kit (variants -> CSS classes)
    motion.ts, intro.ts         shared timings and the intro / transition gate
  styles/globals.css            tokens, type classes, animation initial states
sanity/                         schema types and seed script
sanity.config.ts                Studio configuration
```

## Data flow

`Sanity (or local fallback)` → `lib/content.ts` → Server Components (`page.tsx`) → props → client components.
Client components only receive the fields they render. Content is cached for 60 s and invalidated by the webhook.

## Animation flow

Elements declare their intent with `data-*` attributes (`data-reveal`, `data-story`, `data-blur`, `data-fluid`…).
`ScrollReveal`, `PostStory` and `HeroTitle` read them with GSAP. `lib/intro.ts` holds the page back until the intro or
the page transition has finished, so entrances always start from a covered screen.
