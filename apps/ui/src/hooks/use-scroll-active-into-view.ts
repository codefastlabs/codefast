import type { RefObject } from "react";
import { useEffect } from "react";

/**
 * Scrolls `selector` into view within `containerRef`'s own overflow container,
 * never the page — plain `scrollIntoView` also scrolls the window, yanking a
 * detail page on load. No-ops when the target is null or already visible.
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
