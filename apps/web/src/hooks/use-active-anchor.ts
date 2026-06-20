import { useEffect, useState } from "react";

interface UseActiveAnchorOptions {
  /** IntersectionObserver rootMargin — tune per page (gallery vs detail TOC). */
  readonly rootMargin?: string;
}

const DEFAULT_ROOT_MARGIN = "-15% 0px -75% 0px";

/**
 * Scroll-spy: returns the id of the section anchor currently nearest the top of the view.
 * Shared by gallery letter bands, detail TOC, and mobile jump nav.
 */
export function useActiveAnchor(ids: ReadonlyArray<string>, options?: UseActiveAnchorOptions): string | null {
  const rootMargin = options?.rootMargin ?? DEFAULT_ROOT_MARGIN;
  const [active, setActive] = useState<string | null>(null);

  // Callers pass a freshly-allocated `ids` array each render; key the effect on
  // the content so the observer rebinds only when the id set actually changes.
  const idsKey = ids.join("\n");

  useEffect(() => {
    const targetIds = idsKey.length > 0 ? idsKey.split("\n") : [];
    // Each callback only reports the targets whose intersection *changed*, so keep
    // the latest state for every target and decide from the full set.
    const states = new Map<Element, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          states.set(entry.target, entry.isIntersecting);
        }

        const visible = [...states.entries()]
          .filter(([, isIntersecting]) => isIntersecting)
          .map(([element]) => element);

        // A section anchor (e.g. `#examples`) can wrap its own sub-anchors. When both
        // a container and one of its children are in view, the child is the real
        // location — drop any element that contains another visible one.
        const specific = visible.filter(
          (element) => !visible.some((other) => other !== element && element.contains(other)),
        );

        const topmost = specific.toSorted((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];

        if (topmost) {
          setActive(topmost.id);
        }
      },
      { rootMargin },
    );

    for (const id of targetIds) {
      const element = document.getElementById(id);

      if (element) {
        observer.observe(element);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [idsKey, rootMargin]);

  return active;
}
