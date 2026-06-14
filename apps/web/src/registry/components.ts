/**
 * Eager component-metadata registry, keyed by the component slug.
 *
 * AUTO-DISCOVERED — every `registry/<slug>/meta.ts` contributes one component;
 * there is no hand-maintained list. The slug comes from the folder name and
 * `hasDemo` from whether `<slug>/demo.tsx` exists (the `demos.ts` glob), so
 * neither is authored by hand. Unlike the demo/doc registries this one is
 * EAGER: each meta file is a few lines of pure data with no runtime imports,
 * so the whole registry bundles into one tiny chunk that any route (home hero,
 * /components showcase, ⌘K palette, detail pages) can import freely.
 *
 * Display order on /components is curated: components sort by category (the
 * `CATEGORIES` order below), then by their `order` field within the category.
 * `order` values are sparse (10, 20, 30, …) so a new component slots between
 * two others without renumbering; ties fall back to the display name.
 *
 * TO ADD A COMPONENT: create `registry/<slug>/meta.ts` exporting a single
 * `ComponentMetaInput` — it appears everywhere automatically. Add a
 * `<slug>/demo.tsx` for the showcase card and a `<slug>/doc.ts` for the rich
 * detail page (see `demos.ts` and `docs.ts`).
 */
import { DEMO_BY_SLUG } from "#/registry/demos";

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export const CATEGORIES = [
  {
    id: "display",
    label: "Display",
    description: "Presentational atoms for surfacing information, status, and identity. No interactivity required.",
  },
  {
    id: "form",
    label: "Form",
    description:
      "Input primitives and controls for collecting user data. All keyboard-accessible and screen-reader ready.",
  },
  {
    id: "navigation",
    label: "Navigation",
    description: "Components for moving between views, routes, and pages. Built for keyboard and screen-reader users.",
  },
  {
    id: "overlay",
    label: "Overlay",
    description: "Floating UI: modals, popovers, menus, and tooltips. All trap focus and close on Escape.",
  },
  {
    id: "feedback",
    label: "Feedback",
    description: "Status indicators, confirmations, and loading states that communicate async operations to users.",
  },
  {
    id: "layout",
    label: "Layout",
    description: "Structural components for organising and containing content. Compose freely with any child.",
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

/* -------------------------------------------------------------------------- */
/* Component metadata                                                          */
/* -------------------------------------------------------------------------- */

/** Lifecycle maturity, surfaced as a badge on the detail page. */
export type ComponentStatus = "stable" | "beta" | "deprecated";

/** The authored fields of an `examples/<slug>.meta.ts` file. */
export interface ComponentMetaInput {
  /** Display name, e.g. "Alert Dialog". */
  readonly name: string;
  readonly category: CategoryId;
  /** Curated position within the category on /components — sparse, leave gaps. */
  readonly order: number;
  readonly description: string;
  /** Render the showcase card across two grid columns. */
  readonly wide?: boolean;
  /** Lifecycle maturity. Absent means `stable`; a badge shows only when not stable. */
  readonly status?: ComponentStatus;
  /**
   * For composition recipes (e.g. Date Picker, Data Table) that have no single
   * `@codefast/ui/<slug>` export. Lists the primitives the pattern composes (or
   * a library dep); its presence flips the detail page and showcase card from an
   * import path to a "composed from" note, and hides the source-file link. An
   * empty array marks a plain-markup recipe (e.g. Typography).
   */
  readonly composition?: ReadonlyArray<string>;
}

/** Authored metadata plus the fields derived from the filesystem. */
export interface ComponentMeta extends ComponentMetaInput {
  /** URL/anchor/import slug, e.g. "alert-dialog" — the meta filename. */
  readonly slug: string;
  /** Whether `<slug>.demo.tsx` exists — a live card renders on /components. */
  readonly hasDemo: boolean;
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                    */
/* -------------------------------------------------------------------------- */

const metaModules = import.meta.glob<{ meta: ComponentMetaInput }>("./*/meta.ts", { eager: true });

/** `./button/meta.ts` → `button` — the slug is the component's folder name. */
function slugFromMetaPath(path: string): string {
  const slug = path.split("/")[1];

  if (!slug) {
    throw new Error(`Cannot derive a component slug from meta path "${path}".`);
  }

  return slug;
}

const CATEGORY_RANK: ReadonlyMap<CategoryId, number> = new Map(
  CATEGORIES.map((category, index) => [category.id, index]),
);

/** Every component, in the exact order the /components grid renders. */
export const COMPONENTS: ReadonlyArray<ComponentMeta> = Object.entries(metaModules)
  .map(([path, module]) => {
    const slug = slugFromMetaPath(path);

    if (!module.meta) {
      throw new Error(`Meta file for "${slug}" must export a single \`meta\` object.`);
    }

    return { ...module.meta, slug, hasDemo: DEMO_BY_SLUG.has(slug) };
  })
  .toSorted((a, b) => {
    const rank = (CATEGORY_RANK.get(a.category) ?? 0) - (CATEGORY_RANK.get(b.category) ?? 0);

    return rank || a.order - b.order || a.name.localeCompare(b.name);
  });

/** O(1) slug lookup — routes resolve params against this instead of scanning. */
export const COMPONENT_BY_SLUG: ReadonlyMap<string, ComponentMeta> = new Map(
  COMPONENTS.map((component) => [component.slug, component]),
);

export interface ComponentNeighbors {
  readonly previous?: ComponentMeta | undefined;
  readonly next?: ComponentMeta | undefined;
}

/** Precomputed previous/next in display order, for the detail-page pager. */
export const NEIGHBORS_BY_SLUG: ReadonlyMap<string, ComponentNeighbors> = new Map(
  COMPONENTS.map((component, index) => [
    component.slug,
    { previous: COMPONENTS[index - 1], next: COMPONENTS[index + 1] },
  ]),
);

/** `@codefast/ui/<slug>` import path for a component. */
export function componentPath(slug: string): string {
  return `@codefast/ui/${slug}`;
}

/**
 * The label shown in the import-path chip. Real components show their
 * `@codefast/ui/<slug>` path; composition recipes show the primitives they
 * compose (or `Tailwind utility classes` for plain-markup recipes).
 */
export function componentImportLabel(component: Pick<ComponentMeta, "slug" | "composition">): string {
  if (component.composition === undefined) {
    return componentPath(component.slug);
  }

  return component.composition.length > 0 ? component.composition.join(" · ") : "Tailwind utility classes";
}
