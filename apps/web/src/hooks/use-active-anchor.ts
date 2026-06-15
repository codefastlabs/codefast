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
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .toSorted((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActive(visible[0].target.id);
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
