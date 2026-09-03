import { COMPONENTS } from "#/registry/_core/components";

export const FEATURES = [
  {
    number: "01",
    title: "Accessible by construction",
    description:
      "Keyboard navigation, focus management, and ARIA semantics come from Radix UI primitives — the behavioral building blocks under each component. Correct behavior isn't bolted on. It's where you start.",
  },
  {
    number: "02",
    title: "Yours to own",
    description:
      "Components ship as source: unstyled markup plus Tailwind utility classes. Copy one into your codebase and shape it to your brand. Nothing is hidden behind a wrapper you can't reach.",
  },
  {
    number: "03",
    title: "Typed to the prop",
    description:
      "Every component exports its prop types, so autocomplete, refactors, and composition just work. Mistakes surface in your editor — never at runtime.",
  },
  {
    number: "04",
    title: "Themeable in plain CSS",
    description:
      "Palettes of oklch design tokens with a dark variant. Restyle the whole set from one file, and switch light and dark without a line of JavaScript.",
  },
] as const;

interface DemoWallTile {
  /** Registry slug of the demo to feature. */
  readonly slug: string;
  /** Span the tile across two grid columns. */
  readonly wide?: boolean;
}

/**
 * Curated registry slugs for the home playground grid — visually rich and
 * instantly interactive.
 */
export const DEMO_WALL: ReadonlyArray<DemoWallTile> = [
  { slug: "chart", wide: true },
  { slug: "calendar" },
  { slug: "radio-cards" },
  { slug: "bubble" },
  { slug: "carousel" },
  { slug: "input-otp" },
  { slug: "sonner" },
  { slug: "progress-circle" },
];

export const STATS = [
  { value: `${COMPONENTS.length}+`, label: "components" },
  { value: "100%", label: "accessible" },
  { value: "0", label: "config files" },
] as const;

export const COMPONENT_COUNT = COMPONENTS.length;
