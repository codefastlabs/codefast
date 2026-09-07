import { useEffect, useState } from "react";

/** How far the page scrolls before the sticky control panel folds down to its scenario row. */
const COMPACT_SCROLL_Y = 200;

/**
 * Whether a sticky panel should fold to its essentials: the page has scrolled past the chart's top
 * on a wide viewport and the user has not pinned the panel open.
 *
 * @since 0.8.0
 */
export function useCompactOnScroll(): { isCompact: boolean; pinned: boolean; togglePinned: () => void } {
  const [scrolled, setScrolled] = useState(false);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const wide = window.matchMedia("(min-width: 640px)");
    let scheduled = false;
    const update = () => {
      scheduled = false;
      setScrolled(wide.matches && window.scrollY > COMPACT_SCROLL_Y);
    };
    const onScroll = () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    wide.addEventListener("change", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      wide.removeEventListener("change", update);
    };
  }, []);

  return { isCompact: scrolled && !pinned, pinned, togglePinned: () => setPinned((value) => !value) };
}
