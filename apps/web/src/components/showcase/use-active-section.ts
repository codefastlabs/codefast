import { useEffect, useState } from "react";

/**
 * Scroll-spy: returns the id of the group section currently in view, for
 * highlighting the matching entry in the sidebar / mobile jump nav.
 *
 * `ids` must be a stable reference per view mode so the observer only re-binds
 * when the set of targets actually changes.
 */
export function useActiveSection(ids: ReadonlyArray<string>): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .toSorted((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    for (const id of ids) {
      const element = document.getElementById(id);

      if (element) {
        observer.observe(element);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [ids]);

  return active;
}
