/**
 * Contenido local de respaldo (y fuente del seed de Sanity: `sanity/seed.ts`). La app lee los posts con `lib/content.ts`,
 * que usa Sanity cuando está configurado y esto cuando no.
 * `slug` define la URL: /blog/[slug]. Las cards del listado y de la home linkean a esa ruta.
 * `summary` (texto grande) e `intro` (texto chico) se muestran en el header del post.
 * `intro` admite marcas: {{texto|/ruta}} lo subraya y lo linkea ({{texto}} solo subraya) y :saluting_face: inserta el emoji 🫡 como imagen
 * (los emojis nuevos no se ven en todos los sistemas).
 * Solo "Creating Daylight - The Devex" tiene textos de Figma; el resto tiene textos de ejemplo (placeholders).
 */
/** Bloques del contenido del detalle, se apilan con 80px entre sí (Figma) */
export type PostBlock =
  | {
      type: "section";
      /** Título (h2, Geist 600 38px) */
      title: string;
      /** Texto destacado (Geist 600): lg = 24px, sm = 16px */
      lead: string;
      leadSize?: "lg" | "sm";
      /** Cuerpo (Geist 400 16px) */
      body: string;
      bullets?: string[];
    }
  | {
      type: "quote";
      text: string;
      author: string;
      /** Cargo / rol (gris #666) */
      role: string;
    }
  | { type: "paragraph"; text: string };

export interface PostNavLink {
  slug: string;
  /** Texto corto que se muestra junto al botón */
  label: string;
}

export interface Post {
  slug: string;
  date: string;
  /** "\n" fuerza salto de línea */
  title: string;
  tags: string[];
  /** Portada de la card del listado */
  cover?: string;
  /** Texto grande del header (Geist 400 24px) */
  summary: string;
  /** Texto chico del header (Geist 400 16px) */
  intro: string;
  /** Post destacado: va en el hero y no en el listado */
  featured?: boolean;
  /** Contenido del detalle (debajo de la imagen) */
  content?: PostBlock[];
  /** Navegación previous / next al final del detalle */
  nav?: { prev?: PostNavLink; next?: PostNavLink };
  /** Autores mostrados en el detalle */
  authors?: string[];
  /** Imagen grande del detalle (por defecto la misma portada de la card) */
  image?: string;
}

export const POSTS: Post[] = [
  {
    slug: "creating-daylight-the-devex",
    date: "Jan 3, 2025",
    title: "Creating Daylight\n- The Devex",
    tags: ["Development", "Web Design"],
    featured: true,
    authors: ["Author X", "Author X"],
    image: "/images/garrett-butter.png",
    content: [
      {
        type: "section",
        title: "About debugging",
        lead: "If there's one golden rule we've learned, it would be to ensure quick and solid progress: you should STOP guessing. You need tools that give you detailed, quick, and accurate information to help you understand what’s happening, confirming your suspicions or proving you wrong.",
        body: "If there's one golden rule we've learned, it would be to ensure quick and solid progress: you should STOP guessing. You need tools that give you detailed, quick, and accurate information to help you understand what’s happening, confirming your suspicions or proving you wrong. In Daylight, we had three main goals to achieve: WebGL Scene, Animations, and HTML + WebGL integration. To tackle these, we created a set of tools to meet our needs:",
        bullets: [
          "Debug state",
          "Leva + Mousetrap debug hotkeys",
          "Leverage the power of timeline visualization for animations",
        ],
      },
      {
        type: "quote",
        text: "“A basement studio isn’t just a space—it’s a sanctuary where raw ideas take shape, echoing louder than self-doubt. It’s where creativity flows without limits, mistakes become lessons”",
        author: "Marlon Pierce",
        role: "Developer Engineer",
      },
      {
        type: "paragraph",
        text: "We believe that the debugging experience could be better than console.log-driven development. It should also be thin enough to be your first fast alternative when facing an issue because, let's be honest, you'll always take the faster route in a rush. Our take here was to hide the debug state behind a ?debug param on the url, and a hook to listen to that state. This not only allows anyone to enable it without running the full dev environment but also enhances collaboration. Our designers can participate in the development process by tweaking Leva parameters, for example, making the final result even better.",
      },
      {
        type: "section",
        title: "Offscreen Canvas",
        leadSize: "sm",
        lead: "The OffscreenCanvas API offers a way to detach the canvas context rendering steps from the main thread, resulting in significant performance boosts depending on your use-case. Or it leaves more room on the main thread reserved for magic, depending on how you see it 😉",
        body: "We have a bunch of canvases for Image sequences, WebGL, and noise overlay. Some of them don’t need to be document-synchronized, and some of them do. We needed a way to quickly set them up without caring about resizing, device pixel ratio, offscreen setup, and state management. React hooks are your friends here.",
      },
    ],
    nav: {
      prev: { slug: "gsap-nextjs-setup", label: "GSAP & Next.js Setup" },
      next: { slug: "shipping-ship", label: "Shipping Ship" },
    },
    summary:
      "Discover how we enhanced our development process for the Daylight project, from debugging tips to performance boosts maintaining a clean codebase.",
    intro:
      "Welcome back to our {{Daylight|/blog/creating-daylight-the-shadows}} blog series! If you liked our {{first post on creating those soft and warm shadows|/blog/creating-daylight-the-shadows}}, hold on to your seat. In this second part, we will share with you how we enhanced our dev experience for the Daylight project. We’ll talk about all sorts of topics, from the debugging experience to how we managed to keep the project smooth and clean, keeping an organized codebase. Let’s dive in :saluting_face:",
  },
  {
    slug: "shipping-ship",
    date: "Dec 3, 2025",
    title: "Shipping Ship: Behind the Particle Shader Effect for Vercel's Conf",
    tags: ["Development", "Web Design"],
    cover: "/images/image%201622.png",
    summary:
      "A look at how we built the particle shader effect behind the Ship conference visuals, from the first prototype to keeping thousands of particles at 60fps.",
    intro:
      "Every conference needs a moment people remember. For Ship we wanted letters that break apart into thousands of particles and come back together on cue. Here is how we approached it, what broke along the way and what we would do differently. Let’s dive in.",
    authors: ["Author X", "Author X"],
    content: [
      {
        type: "section",
        title: "The idea",
        lead: "We wanted the type to feel alive: solid at rest, chaotic in motion, and always readable at the end of the animation.",
        body: "The brief was simple, the execution was not. We started with a flat texture of the letters, sampled it to get a point cloud, and moved every point with a shader instead of the CPU. That decision made everything else possible.",
        bullets: [
          "Sample the text into a point cloud",
          "Animate every particle in the vertex shader",
          "Drive the whole effect with a single progress uniform",
        ],
      },
      {
        type: "quote",
        text: "Good motion is just good constraints. Once the animation had one number controlling it, everything got easier to tune.",
        author: "Author X",
        role: "Developer",
      },
      {
        type: "paragraph",
        text: "The last piece was making it feel right. We spent as much time tuning easing curves and timing as we did writing shaders, and it shows: small changes in how particles accelerate made the whole animation feel intentional. We also added a debug panel to tweak values live, which let designers and developers iterate together.",
      },
      {
        type: "section",
        title: "Keeping it fast",
        leadSize: "sm",
        lead: "On a laptop, thousands of particles are easy. On a phone, every extra texture read counts.",
        body: "We moved the simulation into a GPGPU pass, packed positions into a float texture and kept the draw call count at one. We also capped the device pixel ratio and reduced the particle count on low-end devices, which made the effect smooth everywhere.",
      },
    ],
    nav: {
      prev: {
        slug: "creating-daylight-the-devex",
        label: "Creating Daylight - The Devex",
      },
      next: {
        slug: "new-digital-hq-part-1",
        label: "New Digital HQ: Part 1",
      },
    },
  },
  {
    slug: "new-digital-hq-part-1",
    date: "Feb 3, 2023",
    title: "New Digital HQ:\nPart 1",
    tags: ["Development", "Web Design"],
    cover: "/images/image%201618.png",
    summary:
      "The first part of the story behind our new digital headquarters: why we rebuilt it, how we planned it and what we learned before writing a single line of code.",
    intro:
      "Your website is your headquarters, and ours was overdue for a move. In this first part we walk through the goals, the constraints and the decisions that shaped the new home of the studio.",
    authors: ["Author X", "Author X"],
    content: [
      {
        type: "section",
        title: "Why a new home",
        lead: "A studio website should show the work, but it should also feel like the place where the work happens.",
        body: "We started by listing what the old site did well and what got in the way. Fast pages, clear navigation and room for big visuals stayed. Rigid templates and slow updates had to go.",
        bullets: [
          "Show the work first",
          "Make it easy to update",
          "Keep every page fast on any device",
        ],
      },
      {
        type: "quote",
        text: "A good website is never finished. It is a place you keep improving, one small decision at a time.",
        author: "Author X",
        role: "Designer",
      },
      {
        type: "paragraph",
        text: "Planning took longer than expected, and it was worth it. Having a shared vocabulary between design and development saved us countless review rounds later on.",
      },
      {
        type: "section",
        title: "The plan",
        leadSize: "sm",
        lead: "We treated the site like a product: small milestones, real content early and constant feedback.",
        body: "Each milestone ended with something people could open, click and break. That rhythm kept the whole team honest and helped us catch problems while they were still cheap to fix.",
      },
    ],
    nav: {
      prev: {
        slug: "shipping-ship",
        label: "Shipping Ship",
      },
      next: {
        slug: "creating-daylight-the-shadows",
        label: "Creating Daylight - The Shadows",
      },
    },
  },
  {
    slug: "creating-daylight-the-shadows",
    date: "Mar 26, 2025",
    title: "Creating Daylight:\nThe Shadows",
    tags: ["Branding", "Web Design"],
    cover: "/images/image%201625.png",
    summary:
      "How we created the soft and warm shadows of the Daylight project, from the first reference to a real-time result running in the browser.",
    intro:
      "Daylight was all about light, so the shadows had to be right. In this first post of the series we share how we built them, why we chose that approach and the tricks that made them feel warm and natural.",
    authors: ["Author X", "Author X"],
    content: [
      {
        type: "section",
        title: "About shadows",
        lead: "Realistic shadows are not about accuracy, they are about the feeling of a place at a specific time of day.",
        body: "We studied references first: how shadows soften with distance, how they pick up color from the environment and how a warm light changes everything. Only then did we open the code editor.",
        bullets: [
          "Soft edges that grow with distance",
          "Warm tones instead of pure black",
          "A cheap technique that runs everywhere",
        ],
      },
      {
        type: "quote",
        text: "The best effects are the ones you feel before you notice them.",
        author: "Author X",
        role: "Designer",
      },
      {
        type: "paragraph",
        text: "Once the base worked, the rest was iteration. We compared every change against our references, adjusted the falloff and color, and checked it on real devices. The goal was never to be perfect, it was to make people feel the light.",
      },
      {
        type: "section",
        title: "Making it real-time",
        leadSize: "sm",
        lead: "Baked shadows look great, but they do not react. Real-time ones react, but they are expensive.",
        body: "We combined both: a baked base for the static parts and a light real-time pass for the moving ones. The result kept the look we wanted while staying comfortably inside our performance budget.",
      },
    ],
    nav: {
      prev: {
        slug: "new-digital-hq-part-1",
        label: "New Digital HQ: Part 1",
      },
      next: {
        slug: "gsap-nextjs-setup",
        label: "GSAP & Next.js Setup",
      },
    },
  },
  {
    slug: "gsap-nextjs-setup",
    date: "Jan 3, 2025",
    title: "GSAP & Next.js Setup:\nThe BSMNT Way",
    tags: ["Branding", "Web Design"],
    summary:
      "The way we set up GSAP in every Next.js project: one place for plugins, safe cleanup and a simple pattern the whole team can follow.",
    intro:
      "Animations get messy fast when every page does its own thing. This is the setup we use to keep GSAP predictable inside Next.js, from registering plugins to cleaning up on route changes.",
    authors: ["Author X", "Author X"],
    content: [
      {
        type: "section",
        title: "Registering plugins once",
        lead: "Registering plugins in every component is the fastest way to end up with bugs nobody can reproduce.",
        body: "We register everything in a single client module and import it where needed. That way the setup runs once, the bundle stays predictable and there is only one place to look when something is off.",
        bullets: [
          "Register plugins in one file",
          "Use a hook for context and cleanup",
          "Never animate on the server",
        ],
      },
      {
        type: "quote",
        text: "Animation code should be boring to write. If it is exciting, something is probably about to break.",
        author: "Author X",
        role: "Developer",
      },
      {
        type: "paragraph",
        text: "On top of that we wrap animations in a small hook that creates a GSAP context, scopes selectors to a ref and reverts everything when the component unmounts. It is a few lines of code that remove a whole category of problems.",
      },
      {
        type: "section",
        title: "Route changes",
        leadSize: "sm",
        lead: "Leaving a page should leave nothing behind.",
        body: "Because the App Router keeps layouts mounted, we make sure every timeline and ScrollTrigger belongs to a context that dies with its component. Refreshing triggers after images load fixed the last layout jumps.",
      },
    ],
    nav: {
      prev: {
        slug: "creating-daylight-the-shadows",
        label: "Creating Daylight - The Shadows",
      },
      next: {
        slug: "navigating-the-future-nextjs-app-router",
        label: "Next.js App Router",
      },
    },
  },
  {
    slug: "navigating-the-future-nextjs-app-router",
    date: "May 23, 2025",
    title: "Navigating the Future Within\nthe Next.js App Router",
    tags: ["Development", "Web Design"],
    summary:
      "What we learned moving real projects to the Next.js App Router: server components, layouts, loading states and the mistakes to avoid.",
    intro:
      "The App Router changes how you think about pages. After using it in production, here are the patterns that worked for us, the ones that did not and a few tips to make the move smoother.",
    authors: ["Author X", "Author X"],
    content: [
      {
        type: "section",
        title: "Server first",
        lead: "Start on the server and move to the client only when you need interactivity.",
        body: "Most of our pages are now server components that fetch data and render markup. Small client components handle the interactive parts, which keeps the JavaScript we ship to a minimum.",
        bullets: [
          "Fetch data where it is used",
          "Keep client components small and leaf-like",
          "Use layouts for what never changes",
        ],
      },
      {
        type: "quote",
        text: "Boring architecture is a feature. The less clever it is, the faster the team moves.",
        author: "Author X",
        role: "Developer",
      },
      {
        type: "paragraph",
        text: "Migrating step by step also helped. We moved one route at a time, kept both worlds working side by side and only removed the old code once we trusted the new one. It took patience, but nothing ever broke in production.",
      },
      {
        type: "section",
        title: "Loading and errors",
        leadSize: "sm",
        lead: "A good loading state is part of the design, not an afterthought.",
        body: "Loading files and error boundaries let us design those moments on purpose. Streaming content in as it becomes available made pages feel faster even when the data was not.",
      },
    ],
    nav: {
      prev: {
        slug: "gsap-nextjs-setup",
        label: "GSAP & Next.js Setup",
      },
      next: {
        slug: "kidsuper-world-r3f",
        label: "KidSuper World",
      },
    },
  },
  {
    slug: "kidsuper-world-r3f",
    date: "Dec 31, 2025",
    title: "KidSuper World: Bringing\nPaints to Life With R3F",
    tags: ["Branding", "Web Design"],
    summary:
      "Bringing paintings to life in the browser with React Three Fiber: how we turned flat artwork into an interactive world.",
    intro:
      "KidSuper’s art is colorful, playful and full of movement, so the site had to be too. Here is how we used React Three Fiber to turn paintings into a world you can explore.",
    authors: ["Author X", "Author X"],
    content: [
      {
        type: "section",
        title: "From canvas to 3D",
        lead: "The challenge was keeping the hand-made feeling of the paintings inside a 3D scene.",
        body: "We kept textures at the center of the look, added subtle depth and let motion do the rest. Small imperfections, like uneven edges and slight wobbles, made the scene feel painted instead of rendered.",
        bullets: [
          "Textures first, geometry second",
          "Subtle depth instead of heavy effects",
          "Motion that follows the artwork",
        ],
      },
      {
        type: "quote",
        text: "Art on the web should feel touched by a human, not generated by a machine.",
        author: "Author X",
        role: "Designer",
      },
      {
        type: "paragraph",
        text: "R3F made the whole thing feel like building a normal React app. Components, props and state, but with a scene graph on the other side.",
      },
      {
        type: "section",
        title: "Performance",
        leadSize: "sm",
        lead: "Beautiful does not matter if it does not run.",
        body: "We compressed textures, reused materials and loaded scenes on demand. On mobile we simplified the effects while keeping the same look, so everyone gets the experience.",
      },
    ],
    nav: {
      prev: {
        slug: "navigating-the-future-nextjs-app-router",
        label: "Next.js App Router",
      },
      next: {
        slug: "whatever-it-takes-to-craft-a-brand",
        label: "Whatever It Takes",
      },
    },
  },
  {
    slug: "whatever-it-takes-to-craft-a-brand",
    date: "Nov 1, 2021",
    title: "Whatever It Takes to Craft a Brand - Even a Long Flight",
    tags: ["Web Design"],
    cover: "/images/image%201597.png",
    summary:
      "Sometimes crafting a brand means going the extra mile, even if that mile happens at 35,000 feet. A story about process, patience and a very long flight.",
    intro:
      "Great brands are rarely made in a straight line. This is the story of how a long flight, a laptop and a lot of coffee turned into the identity of a project we are proud of.",
    authors: ["Author X", "Author X"],
    content: [
      {
        type: "section",
        title: "The trip",
        lead: "Deadlines do not care where you are, and neither does inspiration.",
        body: "With a long flight ahead and a brand still to define, we decided to use the time. No notifications, no meetings, just a blank page and a clear goal: find the idea that ties everything together.",
        bullets: [
          "Start with the story, not the logo",
          "Explore wide before narrowing down",
          "Test every idea in real applications",
        ],
      },
      {
        type: "quote",
        text: "A brand is not what you say about yourself. It is what people remember after you leave the room.",
        author: "Author X",
        role: "Designer",
      },
      {
        type: "paragraph",
        text: "Back on the ground, the first thing we did was read everything we wrote in the air. Some ideas did not survive the coffee, some became the core of the identity. That editing pass was where the brand really took shape.",
      },
      {
        type: "section",
        title: "Landing",
        leadSize: "sm",
        lead: "By the time we landed, we had a direction we believed in.",
        body: "The hours in the air gave us focus. Once on the ground, we refined the details, built the system and shared it with the client. The rest, as they say, is the fun part.",
      },
    ],
    nav: {
      prev: {
        slug: "kidsuper-world-r3f",
        label: "KidSuper World",
      },
      next: {
        slug: "creating-daylight-the-devex",
        label: "Creating Daylight - The Devex",
      },
    },
  },
];

/** Lo mínimo que necesitan las cards: así a los componentes de cliente no les viaja el contenido completo de cada post */
export type PostSummary = Pick<
  Post,
  "slug" | "date" | "title" | "tags" | "cover"
>;

export const toSummary = ({
  slug,
  date,
  title,
  tags,
  cover,
}: Post): PostSummary => ({
  slug,
  date,
  title,
  tags,
  cover,
});
