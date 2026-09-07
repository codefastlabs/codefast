import { useEffect, useState } from "react";

import { resolveActiveAnchor } from "#/features/components-catalog/lib/active-anchor";

interface UseActiveAnchorOptions {
  /** Where the observation band starts, as a fraction of the viewport height — tune per page for its sticky chrome. */
  readonly bandTop?: number;
  /** Where the observation band ends, as a fraction of the viewport height. */
  readonly bandBottom?: number;
}

interface ActiveAnchor {
  /** The id set the answer was computed for; an answer for another set is stale and reads as `null`. */
  readonly idsKey: string;
  readonly id: string | null;
}

const DEFAULT_BAND_TOP = 0.15;
const DEFAULT_BAND_BOTTOM = 0.25;

/**
 * Scroll-spy: returns the id of the section anchor at the reader's location — the anchor in the band
 * near the top of the viewport, else the last one scrolled past, else the first. Shared by gallery
 * letter bands, the detail TOC, and the mobile jump nav.
 */
export function useActiveAnchor(ids: ReadonlyArray<string>, options?: UseActiveAnchorOptions): string | null {
  const bandTop = options?.bandTop ?? DEFAULT_BAND_TOP;
  const bandBottom = options?.bandBottom ?? DEFAULT_BAND_BOTTOM;
  const [active, setActive] = useState<ActiveAnchor>({ idsKey: "", id: null });

  // Callers pass a freshly-allocated `ids` array each render; key the effect on
  // the content so the observer rebinds only when the id set actually changes.
  const idsKey = ids.join("\n");

  useEffect(() => {
    const targets = (idsKey.length > 0 ? idsKey.split("\n") : []).flatMap((id) => {
      const element = document.getElementById(id);

      return element ? [element] : [];
    });
    // Each callback only reports the targets whose intersection *changed*, so keep
    // the latest state for every target and decide from the full set.
    const inBand = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            inBand.add(entry.target);
          } else {
            inBand.delete(entry.target);
          }
        }

        setActive({ idsKey, id: resolveActiveAnchor(targets, inBand, window.innerHeight * bandTop) });
      },
      { rootMargin: `-${bandTop * 100}% 0px -${(1 - bandBottom) * 100}% 0px` },
    );

    for (const target of targets) {
      observer.observe(target);
    }

    return () => {
      observer.disconnect();
    };
  }, [idsKey, bandTop, bandBottom]);

  return active.idsKey === idsKey ? active.id : null;
}
