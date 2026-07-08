import { useActiveAnchor } from "#/features/components-catalog/hooks/use-active-anchor";

/** Gallery scroll-spy root margin — accounts for sticky header + mobile jump nav. */
const GALLERY_ROOT_MARGIN = "-20% 0px -70% 0px";

/**
 * Scroll-spy for gallery letter bands — highlights sidebar and mobile jump nav.
 * `ids` must be a stable reference per view mode so the observer only re-binds
 * when the set of targets actually changes.
 */
export function useActiveSection(ids: ReadonlyArray<string>): string | null {
  return useActiveAnchor(ids, { rootMargin: GALLERY_ROOT_MARGIN });
}
