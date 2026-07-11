/**
 * Eager component-metadata registry, keyed by slug. Auto-discovered from each
 * `registry/<slug>/meta.ts`; `hasDemo` reflects whether `<slug>/demo.tsx` exists.
 * Eager (unlike the demo/doc registries) because meta is pure data with no runtime
 * imports, so the whole registry bundles into one tiny chunk any route can import
 * freely. Sorted A–Z by name to match the grid and the detail pager; `category` is
 * only a badge/palette tag, not a sort key.
 *
 * To add a component: create `registry/<slug>/meta.ts` exporting one
 * `ComponentMetaInput` (+ optional `demo.tsx` / `doc.ts`).
 */
import { DEMO_BY_SLUG } from "#/registry/_core/demos";

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

/** Descriptive taxonomy tag — surfaced as a badge / palette label, not a sort key. */
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

type CategoryId = (typeof CATEGORIES)[number]["id"];

/* -------------------------------------------------------------------------- */
/* Component metadata                                                          */
/* -------------------------------------------------------------------------- */

/** Lifecycle maturity, surfaced as a badge on the detail page. */
type ComponentStatus = "stable" | "beta" | "deprecated";

/**
 * Release line whose components still count as "new". A component is flagged
 * when its `meta.since` equals this. Bump it each release and the previous
 * batch's "New" badges clear themselves — no per-meta cleanup.
 */
const NEW_SINCE = "0.5";

/** The authored fields of an `examples/<slug>.meta.ts` file. */
export interface ComponentMetaInput {
  /** Display name, e.g. "Alert Dialog". */
  readonly name: string;
  /** Descriptive taxonomy tag (badge + palette search) — does not affect ordering. */
  readonly category: CategoryId;
  readonly description: string;
  /** Render the showcase card across two grid columns. */
  readonly wide?: boolean;
  /** Lifecycle maturity. Absent means `stable`; a badge shows only when not stable. */
  readonly status?: ComponentStatus;
  /**
   * Release line the component first shipped in, e.g. "0.5". Flags a "New" badge
   * while it matches {@link NEW_SINCE}; leave unset for existing components.
   */
  readonly since?: string;
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
  /** Derived from `since === NEW_SINCE` — drives the "New" badge in the nav, gallery, and palette. */
  readonly isNew: boolean;
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                    */
/* -------------------------------------------------------------------------- */

const metaModules = import.meta.glob<{ meta: ComponentMetaInput }>("../*/meta.ts", { eager: true });

/** `./button/meta.ts` → `button` — the slug is the component's folder name. */
function slugFromMetaPath(path: string): string {
  const slug = path.split("/")[1];

  if (!slug) {
    throw new Error(`Cannot derive a component slug from meta path "${path}".`);
  }

  return slug;
}

/** Every component, sorted A–Z by name — the order the /components grid renders. */
export const COMPONENTS: ReadonlyArray<ComponentMeta> = Object.entries(metaModules)
  .map(([path, module]) => {
    const slug = slugFromMetaPath(path);

    if (!module.meta) {
      throw new Error(`Meta file for "${slug}" must export a single \`meta\` object.`);
    }

    return { ...module.meta, slug, hasDemo: DEMO_BY_SLUG.has(slug), isNew: module.meta.since === NEW_SINCE };
  })
  .toSorted((a, b) => a.name.localeCompare(b.name));

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
