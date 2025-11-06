"use client";

import { useEffect, useState } from "react";

/**
 * Event handler type for media query list change events.
 * @param event - The media query list event containing match status.
 */
type MediaQueryChangeHandler = (event: MediaQueryListEvent) => void;

/**
 * Custom hook to listen to CSS media query.
 *
 * @param query - Media query string.
 * @returns Whether the media query matches or not.
 */
export function useMediaQuery(query: string): boolean {
  /**
   * State to store whether the query matches.
   * The initial value is calculated based on the current window state.
   */
  const [matches, setMatches] = useState<boolean>(() => {
    // Ensure initial state matches current media query status
    if (typeof globalThis !== "undefined" && typeof globalThis.matchMedia === "function") {
      return globalThis.matchMedia(query).matches;
    }

    return false;
  });

  useEffect(() => {
    // Only run in a browser environment where matchMedia is available
    if (typeof globalThis === "undefined") {
      return;
    }

    /**
     * MediaQueryList object that can be used to determine if the document
     * matches the media query string.
     */
    const mediaQueryList = globalThis.matchMedia(query);

    /**
     * Updates state when the media query status changes.
     *
     * @param event - The media query list event containing the updated match status.
     */
    const onChange: MediaQueryChangeHandler = (event): void => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener("change", onChange);

    /**
     * Cleanup function that removes the event listener when the component unmounts
     * or when the query changes.
     */
    return (): void => {
      mediaQueryList.removeEventListener("change", onChange);
    };
  }, [query]);

  return matches;
}
