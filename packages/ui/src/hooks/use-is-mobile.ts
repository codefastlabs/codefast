"use client";

import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * The breakpoint width in pixels that separates mobile from non-mobile devices.
 * Screens with width \< MOBILE_BREAKPOINT are considered mobile.
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Custom hook that determines if the current viewport is mobile-sized.
 *
 * This hook uses the useMediaQuery hook to check if the screen width is less than
 * the defined mobile breakpoint (768px).
 *
 * @returns A boolean indicating whether the current viewport is mobile-sized.
 * True if the screen width is less than 768px, false otherwise.
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${(MOBILE_BREAKPOINT - 1).toString()}px)`);
}
