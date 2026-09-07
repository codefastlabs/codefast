import type { RefObject } from "react";
import { useEffect } from "react";

/**
 * Keeps the active chip centered in a horizontal scroller (the mobile letter-jump
 * nav) as `activeChipId` changes. Native `scrollIntoView` with `block: "nearest"`
 * is safe here — unlike the vertical sidebar, centering a chip never scrolls the
 * page. No-ops when nothing is active or the chip isn't found.
 */
export function useScrollChipIntoView(navRef: RefObject<HTMLElement | null>, activeChipId: string | null): void {
  useEffect(() => {
    const nav = navRef.current;

    if (!nav || !activeChipId) {
      return;
    }

    const activeChip = nav.querySelector<HTMLElement>(`[data-chip-id="${activeChipId}"]`);

    activeChip?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [navRef, activeChipId]);
}
