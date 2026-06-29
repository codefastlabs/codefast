/**
 * A–Z showcase data for /components. The content grid and the sidebar nav iterate
 * the SAME buckets so headings, counts, and scroll-spy targets line up exactly.
 * Pure data computed once from `registry/components.ts`.
 */

import type { ComponentMeta } from "#/registry/components";
import { COMPONENTS } from "#/registry/components";
import { DEMO_BY_SLUG } from "#/registry/demos";

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

/** Hero stats for the gallery — totals derived from the registry and grouping above. */
export const GALLERY_STATS = [
  { value: `${COMPONENTS.length}`, label: "components" },
  { value: `${DEMO_BY_SLUG.size}`, label: "live previews" },
  { value: `${ALPHABET_GROUPS.length}`, label: "A–Z groups" },
] as const;
