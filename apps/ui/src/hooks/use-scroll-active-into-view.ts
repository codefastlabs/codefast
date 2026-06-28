import type { RefObject } from "react";
import { useEffect } from "react";

/**
 * Scrolls the element matching `selector` into view within `containerRef`'s own
 * overflow container — never the page. Re-runs whenever `selector` changes (e.g.
 * the active component or letter band), and no-ops when it is null or the target
 * is already fully visible.
 *
 * Plain `scrollIntoView` would also scroll the window, yanking a detail page on
 * load; this nudges only the container's own scroll offset instead.
 */
export function useScrollActiveIntoView(containerRef: RefObject<HTMLElement | null>, selector: string | null): void {
  useEffect(() => {
    const container = containerRef.current;

    if (!container || !selector) {
      return;
    }

    const target = container.querySelector<HTMLElement>(selector);

    if (!target) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const delta =
      targetRect.top < containerRect.top
        ? targetRect.top - containerRect.top
        : targetRect.bottom > containerRect.bottom
          ? targetRect.bottom - containerRect.bottom
          : 0;

    if (delta !== 0) {
      container.scrollBy({ top: delta, behavior: "smooth" });
    }
  }, [containerRef, selector]);
}
