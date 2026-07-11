import { COMPONENTS } from "#/registry/_core/components";

export const FEATURES = [
  {
    number: "01",
    title: "Radix UI primitives",
    description:
      "Every component is built on battle-tested Radix UI primitives. Keyboard navigation, ARIA attributes, and focus management are included — no configuration required.",
  },
  {
    number: "02",
    title: "Dark mode, zero config",
    description:
      "All tokens resolve automatically based on system preference or an explicit user choice. Drop in the CSS and dark mode works everywhere.",
  },
  {
    number: "03",
    title: "Tailwind CSS v4",
    description:
      "Components are unstyled HTML + Tailwind utility classes. Copy the source, customise to your brand — no wrapper components hiding your ability to adapt.",
  },
  {
    number: "04",
    title: "Strict TypeScript",
    description:
      "Full type inference on props, variants, and composition patterns. Catch mistakes at the editor, never at runtime. Every component ships with .d.ts files.",
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
  { slug: "command" },
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
