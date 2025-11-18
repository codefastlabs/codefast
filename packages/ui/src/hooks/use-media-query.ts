'use client';

import { useEffect, useState } from 'react';

/**
 * Event handler for MediaQueryList changes.
 *
 * @param event - Media query change event providing the updated match status.
 */
type MediaQueryChangeHandler = (event: MediaQueryListEvent) => void;

/**
 * Subscribe to a CSS media query and receive its match state.
 *
 * Evaluates the query immediately (when supported) and updates on changes
 * via an event listener.
 *
 * @param query - A valid media query string (e.g., "(max-width: 768px)").
 * @returns true when the media query currently matches; otherwise false.
 *
 * @example
 * ```tsx
 * const isNarrow = useMediaQuery("(max-width: 768px)");
 * ```
 */
export function useMediaQuery(query: string): boolean {
  /**
   * State to store whether the query matches.
   * The initial value is calculated based on the current window state.
   */
  const [matches, setMatches] = useState<boolean>(() => {
    // Ensure initial state matches current media query status
    if (typeof globalThis !== 'undefined' && typeof globalThis.matchMedia === 'function') {
      return globalThis.matchMedia(query).matches;
    }

    return false;
  });

  useEffect(() => {
    // Only run in a browser environment where matchMedia is available
    if (typeof globalThis === 'undefined') {
      return;
    }

    /**
     * MediaQueryList to evaluate and observe the provided query.
     */
    const mediaQueryList = globalThis.matchMedia(query);

    /**
     * Update state when the media query status changes.
     */
    const onChange: MediaQueryChangeHandler = (event): void => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener('change', onChange);

    /**
     * Remove the event listener on unmount or when the query changes.
     */
    return (): void => {
      mediaQueryList.removeEventListener('change', onChange);
    };
  }, [query]);

  return matches;
}
