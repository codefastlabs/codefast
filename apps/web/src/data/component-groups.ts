/**
 * Derived component registries for the /components showcase.
 *
 * The sidebar nav and the content grid both iterate the SAME groups so counts,
 * anchors, and scroll-spy targets line up exactly. Every component appears
 * (including the docs-only Sidebar), so the totals match the hero's "62+".
 *
 * Kept next to the lightweight registry in `components.ts` — this is pure data,
 * computed once at module load, with no UI concerns.
 */

import type { ComponentMeta } from "#/data/components";
import { ALL_COMPONENTS, CATEGORIES } from "#/data/components";

/** A navigable band of components: a category or an A–Z letter. */
export interface ComponentGroup {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly items: ReadonlyArray<ComponentMeta>;
}

/** Components grouped by category, in the curated category order. */
export const CATEGORY_GROUPS: ReadonlyArray<ComponentGroup> = CATEGORIES.map((category) => ({
  id: category.id,
  label: category.label,
  description: category.description,
  items: ALL_COMPONENTS.filter((c) => c.category === category.id),
}));

/** Components grouped by leading letter, A–Z, each bucket A–Z sorted. */
export const ALPHABET_GROUPS: ReadonlyArray<ComponentGroup> = (() => {
  const sorted = [...ALL_COMPONENTS].toSorted((a, b) => a.name.localeCompare(b.name));
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

/** Stable id lists per view mode so the scroll-spy effect re-binds cleanly. */
export const CATEGORY_NAV_IDS = CATEGORY_GROUPS.map((g) => g.id);
export const LETTER_NAV_IDS = ALPHABET_GROUPS.map((g) => g.id);
