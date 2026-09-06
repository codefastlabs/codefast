import { COMPONENTS } from "#/registry/_core/components";

/** One numbered point in a features section. */
export interface Feature {
  readonly number: string;
  readonly title: string;
  readonly description: string;
}

/** Why `@codefast/ui`: the points the `/ui` landing makes. */
export const FEATURES: ReadonlyArray<Feature> = [
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
];

/** Why `@codefast/di`: the points the home page makes, drawn from the package's own README. */
export const DI_PILLARS: ReadonlyArray<Feature> = [
  {
    number: "01",
    title: "Typed tokens",
    description:
      "A Token<Value> flows through every bind → resolve path, so resolve() returns exactly the type you registered, and @injectable checks a class's dependency list against its constructor. A wrong dependency is a compile-time error, not a runtime surprise.",
  },
  {
    number: "02",
    title: "Native Stage 3 decorators",
    description:
      "@injectable, inject, optional, injectAll, @postConstruct and @preDestroy declare dependencies where they are consumed. No reflect-metadata, no experimentalDecorators, no runtime reflection.",
  },
  {
    number: "03",
    title: "Scopes with validation",
    description:
      "Singleton, scoped or transient per binding, child containers for request scopes, and validate() to catch captive dependencies before the first request reaches them.",
  },
  {
    number: "04",
    title: "Modules and introspection",
    description:
      "Bundle bindings into reusable, ref-counted modules. Inspect a container, or render its dependency graph as DOT, Mermaid, Cytoscape or React Flow.",
  },
];

/** The one command the home page's install section copies. */
export const DI_INSTALL_COMMAND = "pnpm add @codefast/di";

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
