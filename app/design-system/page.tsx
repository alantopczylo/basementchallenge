import type { Metadata } from "next";
import { Navbar } from "@/components/layout";
import { Footer } from "@/components/layout";
import { PostCard } from "@/components/blog/PostCard";
import {
  Badge,
  Button,
  Container,
  Section,
  TagList,
  Text,
} from "@/components/ui";
import { colors } from "@/lib/colors";
import { typeVariants, type TypeVariant } from "@/lib/typography";

export const metadata: Metadata = {
  title: "Design system",
  description: "Tokens, tipografía y componentes de basement.",
  robots: { index: false },
};

const SAMPLES: Record<TypeVariant, string> = {
  h1: "Research, insights",
  h2: "Knowledge is meant to be shared",
  h3: "Creating Daylight",
  h3Regular: "Discover how we enhanced our process",
  bodySemibold: "Body semibold, 16px",
  bodyMedium: "Body medium, 16px",
  body: "Body regular, 16px. Welcome back to our blog series.",
  bodySemiboldSm: "Body semibold, 14px",
  bodySm: "Body regular, 14px",
  monoRegular: "Mono regular 14px",
  monoMedium: "Mono medium 14px",
  meta: "Jan 3, 2025",
  caption: "Caption",
};

const Block = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Section space="md">
    <Container>
      <div className="mb-6 border-t border-basement-grey pt-3">
        <Text variant="monoMedium" tone="grey">
          {title}
        </Text>
      </div>
      {children}
    </Container>
  </Section>
);

export default function DesignSystemPage() {
  return (
    <>
      <Navbar />
      <main className="relative z-10 pb-20 pt-[107px] lg:pt-[181px]">
        <Container>
          <Text variant="h1" as="h1" tone="white">
            Design system
          </Text>
          <Text variant="body" tone="muted" className="mt-4 max-w-[520px]">
            Tokens, type-kit y componentes que usa todo el sitio. Cada pieza
            vive en <code>components/ui</code> y se consume desde ahí.
          </Text>
        </Container>

        <Block title="Color">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {Object.entries(colors).map(([name, hex]) => (
              <li key={name} className="flex flex-col gap-2">
                <span
                  className="h-20 border border-basement-grey"
                  style={{ background: hex }}
                />
                <Text variant="meta" tone="white">
                  {name}
                </Text>
                <Text variant="monoRegular" tone="grey">
                  {hex}
                </Text>
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Type-kit">
          <ul className="flex flex-col divide-y divide-basement-dark-grey">
            {(Object.keys(typeVariants) as TypeVariant[]).map((v) => (
              <li
                key={v}
                className="flex flex-col gap-2 py-4 md:flex-row md:items-baseline md:gap-8"
              >
                <Text
                  variant="monoRegular"
                  tone="grey"
                  className="md:w-[200px] md:shrink-0"
                >
                  {v} · .{typeVariants[v]}
                </Text>
                <Text as="p" variant={v} tone="white">
                  {SAMPLES[v]}
                </Text>
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Botones y etiquetas">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="dark">Load more</Button>
            <Button variant="light">Load more</Button>
            <Badge variant="dark">Read more</Badge>
            <Badge variant="light">Read more</Badge>
            <Badge variant="grey">Previous</Badge>
            <TagList tags={["Development", "Web Design"]} />
          </div>
        </Block>

        <Block title="Card">
          <div className="max-w-[436px]">
            <PostCard
              href="/"
              date="Jan 3, 2025"
              title="Creating Daylight - The Devex"
              tags={["Development", "Web Design"]}
              theme="dark"
            />
          </div>
        </Block>
      </main>
      <Footer />
    </>
  );
}
