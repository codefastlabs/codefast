/**
 * A–Z showcase data for the /components route.
 *
 * Every component is sorted A–Z and bucketed by its leading letter. The content
 * grid and the sidebar nav iterate the SAME buckets so the letter headings,
 * counts, and scroll-spy targets line up exactly. Every component appears
 * (including the docs-only Sidebar), so the totals match the hero's count.
 *
 * Pure data computed once at module load from the metadata registry in
 * `registry/components.ts` — no UI concerns.
 */

import type { ComponentMeta } from "#/registry/components";
import { COMPONENTS } from "#/registry/components";

/** A navigable band of components sharing a leading letter. */
export interface ComponentGroup {
  readonly id: string;
  readonly label: string;
  readonly items: ReadonlyArray<ComponentMeta>;
}

/** Components grouped by leading letter, A–Z, each bucket A–Z sorted. */
export const ALPHABET_GROUPS: ReadonlyArray<ComponentGroup> = (() => {
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

/** Scroll-spy target ids, one per letter band, in render order. */
export const ALPHABET_NAV_IDS: ReadonlyArray<string> = ALPHABET_GROUPS.map((group) => group.id);
