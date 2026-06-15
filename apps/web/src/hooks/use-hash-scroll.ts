import { useEffect } from "react";

/**
 * Scrolls to the element matching the current URL hash after layout commits.
 * Used by the component gallery for mobile letter-band jumps.
 */
export function useHashScroll(hash: string): void {
  useEffect(() => {
    if (!hash) {
      return;
    }

    const id = hash.replace(/^#/, "");
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [hash]);
}
