'use client';

import { useMediaQuery } from '@/hooks/use-media-query';

/**
 * Determine whether the current viewport should be treated as mobile.
 *
 * Uses {@link useMediaQuery} to evaluate a max-width media query derived from the
 * provided breakpoint. By default, widths below 768px are considered mobile.
 *
 * @param mobileBreakpoint - Pixel width used as the mobile breakpoint. Values strictly
 * less than this breakpoint are treated as mobile. Defaults to 768.
 * @returns true when the viewport width is less than the given breakpoint; otherwise false.
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 * if (isMobile) {
 *   // Render compact layout
 * }
 * ```
 */
export function useIsMobile(mobileBreakpoint = 768): boolean {
  return useMediaQuery(`(max-width: ${(mobileBreakpoint - 1).toString()}px)`);
}
