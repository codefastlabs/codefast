/**
 * Derived showcase views for the /components route.
 *
 * Each `ViewMode` maps to one `ShowcaseView`: the bands the grid renders plus
 * the scroll-spy target ids. The sidebar nav and the content grid iterate the
 * SAME groups so counts, anchors, and scroll-spy targets line up exactly.
 * Every component appears (including the docs-only Sidebar), so the totals
 * match the hero's "62+".
 *
 * Pure data computed once at module load from the metadata registry in
 * `examples/meta.ts` — no UI concerns.
 */

import type { ComponentMeta } from "#/components/examples/meta";
import { CATEGORIES, COMPONENTS } from "#/components/examples/meta";
import type { ViewMode } from "#/components/showcase/types";

/** A navigable band of components: a category or an A–Z letter. */
export interface ComponentGroup {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly items: ReadonlyArray<ComponentMeta>;
}

/** One showcase layout: its bands plus the scroll-spy target ids. */
export interface ShowcaseView {
  readonly groups: ReadonlyArray<ComponentGroup>;
  readonly navIds: ReadonlyArray<string>;
}

/** Components grouped by category, in the curated category order. */
const CATEGORY_GROUPS: ReadonlyArray<ComponentGroup> = CATEGORIES.map((category) => ({
  id: category.id,
  label: category.label,
  description: category.description,
  items: COMPONENTS.filter((c) => c.category === category.id),
}));

/** Components grouped by leading letter, A–Z, each bucket A–Z sorted. */
const ALPHABET_GROUPS: ReadonlyArray<ComponentGroup> = (() => {
  const sorted = [...COMPONENTS].toSorted((a, b) => a.name.localeCompare(b.name));
  const buckets = new Map<string, Array<ComponentMeta>>();

  for (const component of sorted) {
    const letter = component.name.charAt(0).toUpperCase();
    const bucket = buckets.get(letter);

    if (bucket) {
      bucket.push(component);
    } else {
      buckets.set(letter, [component]);
    }
  }

  return [...buckets.entries()]
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([letter, items]) => ({ id: `letter-${letter}`, label: letter, items }));
})();

function toView(groups: ReadonlyArray<ComponentGroup>): ShowcaseView {
  return { groups, navIds: groups.map((group) => group.id) };
}

/** Everything the /components route needs, keyed by `?view` mode. */
export const SHOWCASE_VIEWS: Record<ViewMode, ShowcaseView> = {
  category: toView(CATEGORY_GROUPS),
  alphabetical: toView(ALPHABET_GROUPS),
};
