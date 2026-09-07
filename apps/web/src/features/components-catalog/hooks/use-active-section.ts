import { useActiveAnchor } from "#/features/components-catalog/hooks/use-active-anchor";

/** Gallery scroll-spy band — set lower than the default to clear the sticky header plus the mobile jump nav. */
const GALLERY_BAND = { bandTop: 0.2, bandBottom: 0.3 };

/**
 * Scroll-spy for gallery letter bands — highlights sidebar and mobile jump nav.
 * `ids` must be a stable reference per view mode so the observer only re-binds
 * when the set of targets actually changes.
 */
export function useActiveSection(ids: ReadonlyArray<string>): string | null {
  return useActiveAnchor(ids, GALLERY_BAND);
}
